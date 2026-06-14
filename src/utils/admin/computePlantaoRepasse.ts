import type { EscalaRepasseRule } from '../../types/adminEscala'
import type { AdminPlantaoElegibilidade } from '../../types/adminProfissionalRepasse'
import { ensureRepasseRule, normalizeCriteriosPresenca } from '../adminEscala/repasseRule'

export type ComputePlantaoRepasseInput = {
  plantaoEncerrado: boolean
  percentualOnline: number | null
  consultasAgendadas: number
  encaixes: number
  atendidos: number
  encerramentoFormal: boolean
  repasseRule: EscalaRepasseRule
  valorDeclaradoCentavos?: number | null
}

export type ComputePlantaoRepasseResult = {
  elegibilidade: AdminPlantaoElegibilidade
  valorCalculadoCentavos: number
  alertas: string[]
  motivos: string[]
}

function hasDemandaComprovada(plantao: ComputePlantaoRepasseInput) {
  return plantao.consultasAgendadas + plantao.encaixes > 0
}

function computeValorIntegral(plantao: ComputePlantaoRepasseInput, rule: EscalaRepasseRule): number {
  switch (rule.modalidade) {
    case 'plantao_fixo':
      return rule.valorPlantaoCentavos
    case 'por_consulta':
      return plantao.atendidos * rule.valorConsultaCentavos
    case 'hibrido': {
      const pct = rule.percentualFixoHibrido ?? 30
      const fixo = Math.round((rule.valorPlantaoCentavos * pct) / 100)
      return fixo + plantao.atendidos * rule.valorConsultaCentavos
    }
    default:
      return 0
  }
}

function computeValorProporcional(plantao: ComputePlantaoRepasseInput, rule: EscalaRepasseRule): number {
  if (rule.valorConsultaCentavos > 0) {
    return plantao.atendidos * rule.valorConsultaCentavos
  }
  if (rule.modalidade === 'por_consulta') {
    return 0
  }
  const fallbackRate =
    rule.valorPlantaoCentavos > 0
      ? Math.round(rule.valorPlantaoCentavos / Math.max(plantao.consultasAgendadas + plantao.encaixes, 1))
      : 0
  return plantao.atendidos * fallbackRate
}

function evaluatePresenca(
  plantao: ComputePlantaoRepasseInput,
  rule: EscalaRepasseRule,
): { onlineOk: boolean; demandaOk: boolean; encerramentoOk: boolean; alertas: string[]; motivos: string[] } {
  const criterios = normalizeCriteriosPresenca(rule.criteriosPresenca)
  const alertas: string[] = []
  const motivos: string[] = []

  const online = plantao.percentualOnline ?? 0
  const onlineOk = plantao.percentualOnline !== null && online >= criterios.minPercentualOnline
  if (plantao.percentualOnline === null) {
    alertas.push('Sem registro de presença online')
    motivos.push('Presença online não registrada')
  } else if (!onlineOk) {
    alertas.push(`Online ${online}% abaixo do mínimo ${criterios.minPercentualOnline}%`)
    motivos.push(`Percentual online (${online}%) inferior ao exigido (${criterios.minPercentualOnline}%)`)
  } else {
    motivos.push(`Percentual online (${online}%) atende ao mínimo`)
  }

  const encerramentoOk = !criterios.exigeEncerramentoFormal || plantao.encerramentoFormal
  if (criterios.exigeEncerramentoFormal && !plantao.encerramentoFormal) {
    alertas.push('Encerramento formal não registrado')
    motivos.push('Encerramento formal exigido e não realizado')
  }

  const demandaComprovada = hasDemandaComprovada(plantao)
  const demandaOk =
    plantao.atendidos >= criterios.minConsultasConcluidas ||
    (criterios.aceitaSemDemandaComprovada && !demandaComprovada)

  if (!demandaOk) {
    if (demandaComprovada) {
      alertas.push(
        `Apenas ${plantao.atendidos} consulta(s) — mínimo ${criterios.minConsultasConcluidas}`,
      )
      motivos.push('Demanda comprovada, mas consultas concluídas abaixo do mínimo')
    } else if (!criterios.aceitaSemDemandaComprovada) {
      alertas.push('Sem demanda comprovada e critério não aceita turno vazio')
      motivos.push('Turno sem demanda e regra não aceita pagamento sem fila')
    }
  } else if (!demandaComprovada && criterios.aceitaSemDemandaComprovada) {
    motivos.push('Turno sem demanda comprovada — aceito pela regra do slot')
  } else {
    motivos.push(`${plantao.atendidos} consulta(s) concluída(s)`)
  }

  return { onlineOk, demandaOk, encerramentoOk, alertas, motivos }
}

/**
 * Calcula elegibilidade e valor de repasse com base na regra definida na escala (slot).
 */
export function computePlantaoRepasse(plantao: ComputePlantaoRepasseInput): ComputePlantaoRepasseResult {
  const rule = ensureRepasseRule(plantao.repasseRule)
  const criterios = normalizeCriteriosPresenca(rule.criteriosPresenca)

  if (!plantao.plantaoEncerrado) {
    return {
      elegibilidade: 'pendente',
      valorCalculadoCentavos: 0,
      alertas: [],
      motivos: ['Plantão ainda não encerrado'],
    }
  }

  const presenca = evaluatePresenca(plantao, rule)
  const alertas = [...presenca.alertas]
  const motivos = [...presenca.motivos]

  const online = plantao.percentualOnline ?? 0
  const criteriosIntegrais =
    presenca.onlineOk && presenca.demandaOk && presenca.encerramentoOk

  if (plantao.percentualOnline !== null && online < 50) {
    alertas.push('Presença crítica: menos de 50% do turno online')
    const valor =
      criterios.tratamentoInelegivel === 'proporcional_consultas'
        ? computeValorProporcional(plantao, rule)
        : 0
    return {
      elegibilidade: 'indeferido',
      valorCalculadoCentavos: valor,
      alertas,
      motivos: [...motivos, 'Presença inferior a 50% — indeferido'],
    }
  }

  if (criteriosIntegrais) {
    const valorCalculadoCentavos = computeValorIntegral(plantao, rule)
    if (
      plantao.valorDeclaradoCentavos != null &&
      Math.abs(plantao.valorDeclaradoCentavos - valorCalculadoCentavos) >
        Math.max(valorCalculadoCentavos * 0.1, 5000)
    ) {
      alertas.push('Divergência relevante entre valor calculado e NF')
    }
    return {
      elegibilidade: 'elegivel',
      valorCalculadoCentavos,
      alertas,
      motivos: [...motivos, 'Critérios integrais atendidos'],
    }
  }

  if (criterios.tratamentoInelegivel === 'proporcional_consultas') {
    const valorCalculadoCentavos = computeValorProporcional(plantao, rule)
    return {
      elegibilidade: 'parcial',
      valorCalculadoCentavos,
      alertas,
      motivos: [...motivos, 'Repasse proporcional às consultas concluídas'],
    }
  }

  return {
    elegibilidade: presenca.onlineOk ? 'parcial' : 'indeferido',
    valorCalculadoCentavos: 0,
    alertas: [...alertas, 'Aguardando análise manual do financeiro'],
    motivos: [...motivos, 'Critérios não cumpridos — análise manual'],
  }
}

/** Valor de referência contratado se todos os critérios integrais forem cumpridos. */
export function computePlantaoValorReferenciaCentavos(input: ComputePlantaoRepasseInput): number {
  const rule = ensureRepasseRule(input.repasseRule)
  return computeValorIntegral(input, rule)
}

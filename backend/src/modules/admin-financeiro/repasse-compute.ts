import type {
  AdminPlantaoElegibilidade,
  EscalaRepasseCriteriosPresenca,
  EscalaRepasseModalidade,
  EscalaRepasseRule,
} from './types.js'

const DEFAULT_CRITERIOS: EscalaRepasseCriteriosPresenca = {
  minPercentualOnline: 80,
  exigeEncerramentoFormal: true,
  minConsultasConcluidas: 1,
  aceitaSemDemandaComprovada: false,
  tratamentoInelegivel: 'proporcional_consultas',
}

export function normalizeCriteriosPresenca(
  raw: Partial<EscalaRepasseCriteriosPresenca> | null | undefined,
): EscalaRepasseCriteriosPresenca {
  return {
    minPercentualOnline:
      typeof raw?.minPercentualOnline === 'number' ? raw.minPercentualOnline : DEFAULT_CRITERIOS.minPercentualOnline,
    exigeEncerramentoFormal:
      typeof raw?.exigeEncerramentoFormal === 'boolean'
        ? raw.exigeEncerramentoFormal
        : DEFAULT_CRITERIOS.exigeEncerramentoFormal,
    minConsultasConcluidas:
      typeof raw?.minConsultasConcluidas === 'number'
        ? raw.minConsultasConcluidas
        : DEFAULT_CRITERIOS.minConsultasConcluidas,
    aceitaSemDemandaComprovada:
      typeof raw?.aceitaSemDemandaComprovada === 'boolean'
        ? raw.aceitaSemDemandaComprovada
        : DEFAULT_CRITERIOS.aceitaSemDemandaComprovada,
    tratamentoInelegivel:
      raw?.tratamentoInelegivel === 'aguardando_analise_manual'
        ? 'aguardando_analise_manual'
        : 'proporcional_consultas',
  }
}

export function parseRepasseRule(raw: unknown, fallbackValorCentavos = 0): EscalaRepasseRule {
  const obj =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}

  const modalidade: EscalaRepasseModalidade =
    obj.modalidade === 'por_consulta' || obj.modalidade === 'hibrido'
      ? obj.modalidade
      : 'plantao_fixo'

  const valorPlantaoCentavos =
    typeof obj.valorPlantaoCentavos === 'number'
      ? obj.valorPlantaoCentavos
      : typeof obj.valor_plantao_centavos === 'number'
        ? obj.valor_plantao_centavos
        : fallbackValorCentavos

  const valorConsultaCentavos =
    typeof obj.valorConsultaCentavos === 'number'
      ? obj.valorConsultaCentavos
      : typeof obj.valor_consulta_centavos === 'number'
        ? obj.valor_consulta_centavos
        : 0

  const criteriosRaw =
    obj.criteriosPresenca && typeof obj.criteriosPresenca === 'object'
      ? (obj.criteriosPresenca as Partial<EscalaRepasseCriteriosPresenca>)
      : obj.criterios_presenca && typeof obj.criterios_presenca === 'object'
        ? (obj.criterios_presenca as Partial<EscalaRepasseCriteriosPresenca>)
        : undefined

  return {
    modalidade,
    valorPlantaoCentavos,
    valorConsultaCentavos,
    percentualFixoHibrido:
      typeof obj.percentualFixoHibrido === 'number'
        ? obj.percentualFixoHibrido
        : typeof obj.percentual_fixo_hibrido === 'number'
          ? obj.percentual_fixo_hibrido
          : modalidade === 'hibrido'
            ? 30
            : undefined,
    criteriosPresenca: normalizeCriteriosPresenca(criteriosRaw),
  }
}

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
  if (rule.modalidade === 'por_consulta') return 0
  const fallbackRate =
    rule.valorPlantaoCentavos > 0
      ? Math.round(rule.valorPlantaoCentavos / Math.max(plantao.consultasAgendadas + plantao.encaixes, 1))
      : 0
  return plantao.atendidos * fallbackRate
}

function evaluatePresenca(plantao: ComputePlantaoRepasseInput, rule: EscalaRepasseRule) {
  const criterios = normalizeCriteriosPresenca(rule.criteriosPresenca)
  const alertas: string[] = []

  const online = plantao.percentualOnline ?? 0
  const onlineOk = plantao.percentualOnline !== null && online >= criterios.minPercentualOnline
  if (plantao.percentualOnline === null) {
    alertas.push('Sem registro de presença online')
  } else if (!onlineOk) {
    alertas.push(`Online ${online}% abaixo do mínimo ${criterios.minPercentualOnline}%`)
  }

  const encerramentoOk = !criterios.exigeEncerramentoFormal || plantao.encerramentoFormal
  if (criterios.exigeEncerramentoFormal && !plantao.encerramentoFormal) {
    alertas.push('Encerramento formal não registrado')
  }

  const demandaComprovada = hasDemandaComprovada(plantao)
  const demandaOk =
    plantao.atendidos >= criterios.minConsultasConcluidas ||
    (criterios.aceitaSemDemandaComprovada && !demandaComprovada)

  if (!demandaOk) {
    if (demandaComprovada) {
      alertas.push(`Apenas ${plantao.atendidos} consulta(s) — mínimo ${criterios.minConsultasConcluidas}`)
    } else if (!criterios.aceitaSemDemandaComprovada) {
      alertas.push('Sem demanda comprovada e critério não aceita turno vazio')
    }
  }

  return { onlineOk, demandaOk, encerramentoOk, alertas, criterios }
}

export function computePlantaoRepasse(plantao: ComputePlantaoRepasseInput): ComputePlantaoRepasseResult {
  const rule = plantao.repasseRule
  const criterios = normalizeCriteriosPresenca(rule.criteriosPresenca)

  if (!plantao.plantaoEncerrado) {
    return { elegibilidade: 'pendente', valorCalculadoCentavos: 0, alertas: [] }
  }

  const presenca = evaluatePresenca(plantao, rule)
  const alertas = [...presenca.alertas]
  const online = plantao.percentualOnline ?? 0
  const criteriosIntegrais = presenca.onlineOk && presenca.demandaOk && presenca.encerramentoOk

  if (plantao.percentualOnline !== null && online < 50) {
    const valor =
      criterios.tratamentoInelegivel === 'proporcional_consultas'
        ? computeValorProporcional(plantao, rule)
        : 0
    return { elegibilidade: 'indeferido', valorCalculadoCentavos: valor, alertas }
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
    return { elegibilidade: 'elegivel', valorCalculadoCentavos, alertas }
  }

  if (criterios.tratamentoInelegivel === 'proporcional_consultas') {
    return {
      elegibilidade: 'parcial',
      valorCalculadoCentavos: computeValorProporcional(plantao, rule),
      alertas,
    }
  }

  return {
    elegibilidade: presenca.onlineOk ? 'parcial' : 'indeferido',
    valorCalculadoCentavos: 0,
    alertas: [...alertas, 'Aguardando análise manual do financeiro'],
  }
}

export function aggregateElegibilidade(
  items: AdminPlantaoElegibilidade[],
): AdminPlantaoElegibilidade {
  if (items.length === 0) return 'pendente'
  if (items.every((e) => e === 'elegivel')) return 'elegivel'
  if (items.some((e) => e === 'indeferido')) return 'indeferido'
  if (items.some((e) => e === 'parcial')) return 'parcial'
  if (items.some((e) => e === 'pendente')) return 'pendente'
  return 'parcial'
}

export function predominantModalidade(
  rules: EscalaRepasseModalidade[],
): EscalaRepasseModalidade {
  const counts = new Map<EscalaRepasseModalidade, number>()
  for (const m of rules) {
    counts.set(m, (counts.get(m) ?? 0) + 1)
  }
  let best: EscalaRepasseModalidade = 'plantao_fixo'
  let bestCount = 0
  for (const [m, c] of counts) {
    if (c > bestCount) {
      best = m
      bestCount = c
    }
  }
  return best
}

export function mapFechamentoStatusToRepasse(
  status: string,
): 'pendente_conferencia' | 'aprovado' | 'pago' | 'rejeitado' {
  switch (status) {
    case 'aprovado':
      return 'aprovado'
    case 'pago':
      return 'pago'
    case 'rejeitado':
      return 'rejeitado'
    default:
      return 'pendente_conferencia'
  }
}

export function mapRepasseActionToFechamentoStatus(
  action: 'aprovar' | 'rejeitar' | 'correcao' | 'marcar_pago',
): string {
  switch (action) {
    case 'aprovar':
      return 'aprovado'
    case 'rejeitar':
      return 'rejeitado'
    case 'correcao':
      return 'aberto'
    case 'marcar_pago':
      return 'pago'
    default:
      return 'em_analise'
  }
}

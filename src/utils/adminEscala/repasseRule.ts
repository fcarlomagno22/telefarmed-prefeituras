import type {
  AdminEscalaProgrammingSlot,
  EscalaRepasseModalidade,
  EscalaRepasseRule,
  EscalaRepasseTratamentoInelegivel,
} from '../../types/adminEscala'
import { PROFISSIONAL_SHIFT_AMOUNT_CENTS } from '../../config/profissionalShiftRates'

export const ESCALA_REPASSE_TRATAMENTO_INELEGIVEL_OPTIONS: {
  value: EscalaRepasseTratamentoInelegivel
  label: string
  help: string
}[] = [
  {
    value: 'proporcional_consultas',
    label: 'Pagar só consultas concluídas (proporcional)',
    help: 'Gera repasse automático apenas pelas consultas concluídas, sem valor integral do plantão.',
  },
  {
    value: 'aguardando_analise_manual',
    label: 'Parcial — aguardando análise manual',
    help: 'Não gera conta a pagar integral; o financeiro revisa e decide o valor antes de aprovar.',
  },
]

export function normalizeCriteriosPresenca(
  raw:
    | Partial<EscalaRepasseRule['criteriosPresenca']> & { pagaSemDemanda?: boolean }
    | undefined
    | null,
): EscalaRepasseRule['criteriosPresenca'] {
  if (!raw) {
    return {
      minPercentualOnline: 80,
      exigeEncerramentoFormal: true,
      minConsultasConcluidas: 1,
      aceitaSemDemandaComprovada: true,
      tratamentoInelegivel: 'aguardando_analise_manual',
    }
  }

  const aceitaSemDemanda =
    raw.aceitaSemDemandaComprovada ??
    (typeof raw.pagaSemDemanda === 'boolean' ? raw.pagaSemDemanda : true)

  const minConsultas =
    raw.minConsultasConcluidas ??
    (aceitaSemDemanda && raw.pagaSemDemanda === true ? 0 : 1)

  return {
    minPercentualOnline: Number(raw.minPercentualOnline ?? 80),
    exigeEncerramentoFormal: raw.exigeEncerramentoFormal ?? true,
    minConsultasConcluidas: Math.max(0, Number(minConsultas)),
    aceitaSemDemandaComprovada: aceitaSemDemanda,
    tratamentoInelegivel:
      raw.tratamentoInelegivel === 'proporcional_consultas' ||
      raw.tratamentoInelegivel === 'aguardando_analise_manual'
        ? raw.tratamentoInelegivel
        : 'aguardando_analise_manual',
  }
}
export const ESCALA_REPASSE_MODALIDADE_OPTIONS: {
  value: EscalaRepasseModalidade
  label: string
  help: string
}[] = [
  {
    value: 'plantao_fixo',
    label: 'Plantão fixo',
    help: 'Valor integral só se cumprir todos os critérios de presença abaixo. Caso contrário, aplica o tratamento configurado (proporcional ou análise manual).',
  },
  {
    value: 'por_consulta',
    label: 'Por consulta',
    help: 'Repasse proporcional às consultas concluídas. Reduz risco de pagamento por presença parcial.',
  },
  {
    value: 'hibrido',
    label: 'Híbrido',
    help: 'Parte fixa do valor do plantão + complemento por consulta, após cumprir os critérios de presença.',
  },
]

export function createDefaultRepasseRule(
  valorPlantaoCentavos = PROFISSIONAL_SHIFT_AMOUNT_CENTS,
): EscalaRepasseRule {
  return {
    modalidade: 'plantao_fixo',
    valorPlantaoCentavos,
    valorConsultaCentavos: 0,
    criteriosPresenca: normalizeCriteriosPresenca(null),
  }
}

export function ensureRepasseRule(
  rule: EscalaRepasseRule | undefined | null,
  fallbackAmountCents = PROFISSIONAL_SHIFT_AMOUNT_CENTS,
): EscalaRepasseRule {
  if (!rule?.modalidade) {
    return createDefaultRepasseRule(fallbackAmountCents)
  }

  return {
    ...rule,
    valorPlantaoCentavos: Number(rule.valorPlantaoCentavos ?? fallbackAmountCents),
    valorConsultaCentavos: Number(rule.valorConsultaCentavos ?? 0),
    criteriosPresenca: normalizeCriteriosPresenca(rule.criteriosPresenca),
  }
}

export function normalizeProgrammingSlot(
  slot: AdminEscalaProgrammingSlot,
): AdminEscalaProgrammingSlot {
  return {
    ...slot,
    repasseRule: ensureRepasseRule(slot.repasseRule, slot.amountCents),
  }
}

export function syncRepasseRuleAmounts(
  rule: EscalaRepasseRule,
  amountCents: number,
): EscalaRepasseRule {
  const next = {
    ...rule,
    criteriosPresenca: normalizeCriteriosPresenca(rule.criteriosPresenca),
  }

  if (next.modalidade === 'plantao_fixo' || next.modalidade === 'hibrido') {
    next.valorPlantaoCentavos = amountCents
  }

  if (next.modalidade === 'por_consulta' && next.valorConsultaCentavos <= 0 && amountCents > 0) {
    next.valorConsultaCentavos = amountCents
  }

  if (next.modalidade !== 'hibrido') {
    delete next.percentualFixoHibrido
  } else if (next.percentualFixoHibrido == null) {
    next.percentualFixoHibrido = 30
  }

  return next
}

export function applyRepasseModalidadeChange(
  modalidade: EscalaRepasseModalidade,
  current: EscalaRepasseRule,
  amountCents: number,
): EscalaRepasseRule {
  const base = syncRepasseRuleAmounts({ ...current, modalidade }, amountCents)

  if (modalidade === 'por_consulta') {
    return {
      ...base,
      modalidade,
      valorPlantaoCentavos: 0,
      valorConsultaCentavos:
        base.valorConsultaCentavos > 0 ? base.valorConsultaCentavos : Math.max(amountCents, 0),
      percentualFixoHibrido: undefined,
    }
  }

  if (modalidade === 'plantao_fixo') {
    return {
      ...base,
      modalidade,
      valorPlantaoCentavos: amountCents > 0 ? amountCents : base.valorPlantaoCentavos,
      valorConsultaCentavos: 0,
      percentualFixoHibrido: undefined,
    }
  }

  return {
    ...base,
    modalidade: 'hibrido',
    valorPlantaoCentavos: amountCents > 0 ? amountCents : base.valorPlantaoCentavos,
    valorConsultaCentavos:
      base.valorConsultaCentavos > 0 ? base.valorConsultaCentavos : Math.round(amountCents * 0.15),
    percentualFixoHibrido: base.percentualFixoHibrido ?? 30,
  }
}

export function resolveSlotAmountCents(
  amountCents: number,
  rule: EscalaRepasseRule | undefined | null,
): number {
  const safe = ensureRepasseRule(rule, amountCents)
  if (safe.modalidade === 'por_consulta') {
    return safe.valorConsultaCentavos
  }
  return amountCents > 0 ? amountCents : safe.valorPlantaoCentavos
}

export function validateRepasseRule(rule: EscalaRepasseRule, amountCents: number): string | null {
  if (rule.modalidade === 'plantao_fixo') {
    const valor = amountCents > 0 ? amountCents : rule.valorPlantaoCentavos
    if (valor <= 0) return 'Informe o valor do plantão fixo.'
  }

  if (rule.modalidade === 'por_consulta' && rule.valorConsultaCentavos <= 0) {
    return 'Informe o valor por consulta.'
  }

  if (rule.modalidade === 'hibrido') {
    const valorPlantao = amountCents > 0 ? amountCents : rule.valorPlantaoCentavos
    if (valorPlantao <= 0) return 'Informe a parte fixa do plantão híbrido.'
    if (rule.valorConsultaCentavos <= 0) return 'Informe o valor por consulta do híbrido.'
    if (rule.percentualFixoHibrido == null || rule.percentualFixoHibrido < 1) {
      return 'Informe o percentual fixo do híbrido (1–99%).'
    }
    if (rule.percentualFixoHibrido > 99) return 'O percentual fixo do híbrido deve ser no máximo 99%.'
  }

  if (
    rule.criteriosPresenca.minPercentualOnline < 1 ||
    rule.criteriosPresenca.minPercentualOnline > 100
  ) {
    return 'O percentual mínimo online deve estar entre 1% e 100%.'
  }

  const criterios = rule.criteriosPresenca
  if (criterios.minConsultasConcluidas < 0) {
    return 'O mínimo de consultas concluídas não pode ser negativo.'
  }
  if (!criterios.aceitaSemDemandaComprovada && criterios.minConsultasConcluidas < 1) {
    return 'Informe ao menos 1 consulta concluída ou aceite turno sem demanda comprovada.'
  }

  return null
}

export function formatRepasseRuleSummary(rule: EscalaRepasseRule): string {
  const criterios = normalizeCriteriosPresenca(rule.criteriosPresenca)
  const minOnline = criterios.minPercentualOnline
  const tratamento =
    criterios.tratamentoInelegivel === 'proporcional_consultas' ? 'prop.' : 'análise'
  switch (rule.modalidade) {
    case 'plantao_fixo':
      return `Fixo · ≥${minOnline}% online · senão ${tratamento}`
    case 'por_consulta':
      return `Por consulta · ≥${minOnline}% online`
    case 'hibrido':
      return `Híbrido ${rule.percentualFixoHibrido ?? 0}% + consulta · ≥${minOnline}% online`
    default:
      return 'Repasse'
  }
}

export function formatCriteriosPresencaResumo(criterios: EscalaRepasseRule['criteriosPresenca']): string {
  const normalized = normalizeCriteriosPresenca(criterios)
  const demanda =
    normalized.aceitaSemDemandaComprovada && normalized.minConsultasConcluidas > 0
      ? `≥${normalized.minConsultasConcluidas} consultas ou sem demanda`
      : normalized.aceitaSemDemandaComprovada
        ? 'sem demanda comprovada ou consultas'
        : `≥${normalized.minConsultasConcluidas} consultas`
  const encerramento = normalized.exigeEncerramentoFormal ? 'encerramento formal' : 'sem exigir encerramento'
  const tratamento =
    ESCALA_REPASSE_TRATAMENTO_INELEGIVEL_OPTIONS.find(
      (item) => item.value === normalized.tratamentoInelegivel,
    )?.label ?? normalized.tratamentoInelegivel
  return `Integral se: ≥${normalized.minPercentualOnline}% online, ${encerramento}, ${demanda}. Senão: ${tratamento}.`
}

export function tratamentoInelegivelLabel(
  value: EscalaRepasseRule['criteriosPresenca']['tratamentoInelegivel'],
): string {
  return (
    ESCALA_REPASSE_TRATAMENTO_INELEGIVEL_OPTIONS.find((item) => item.value === value)?.label ?? value
  )
}

export function repasseModalidadeLabel(modalidade: EscalaRepasseModalidade): string {
  return ESCALA_REPASSE_MODALIDADE_OPTIONS.find((item) => item.value === modalidade)?.label ?? modalidade
}

/** Rótulo curto para chips em tabelas (ex.: "Fixo", "Por consulta"). */
export function repasseChipShortLabel(modalidade: EscalaRepasseModalidade): string {
  switch (modalidade) {
    case 'plantao_fixo':
      return 'Fixo'
    case 'por_consulta':
      return 'Por consulta'
    case 'hibrido':
      return 'Híbrido'
    default:
      return 'Repasse'
  }
}

/** Rótulo de coluna/listagem: "Repasse: Fixo". */
export function formatRepasseListLabel(rule: EscalaRepasseRule): string {
  const safe = ensureRepasseRule(rule)
  return `Repasse: ${repasseChipShortLabel(safe.modalidade)}`
}

function formatRepasseCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Linhas para tooltip/badge com modalidade e parâmetros da regra. */
export function buildRepasseTooltipLines(
  rule: EscalaRepasseRule,
  amountCents?: number,
): string[] {
  const safe = ensureRepasseRule(rule, amountCents ?? rule.valorPlantaoCentavos)
  const lines: string[] = [repasseModalidadeLabel(safe.modalidade)]

  if (safe.modalidade === 'plantao_fixo' || safe.modalidade === 'hibrido') {
    const valorPlantao =
      amountCents && amountCents > 0 && safe.modalidade === 'plantao_fixo'
        ? amountCents
        : safe.valorPlantaoCentavos
    lines.push(`Valor do plantão: ${formatRepasseCurrency(valorPlantao)}`)
  }

  if (safe.modalidade === 'por_consulta' || safe.modalidade === 'hibrido') {
    lines.push(`Valor por consulta: ${formatRepasseCurrency(safe.valorConsultaCentavos)}`)
  }

  if (safe.modalidade === 'hibrido') {
    lines.push(`Parte fixa: ${safe.percentualFixoHibrido ?? 0}% do valor base + consultas`)
  }

  lines.push(formatRepasseRuleSummary(safe))
  lines.push(formatCriteriosPresencaResumo(safe.criteriosPresenca))
  return lines
}

export const ESCALA_REPASSE_READONLY_NOTICE =
  'Alteração de repasse exige novo slot ou revisão administrativa.'

export function parseRepasseRuleFromApi(
  raw: unknown,
  fallbackAmountCents: number,
): EscalaRepasseRule {
  if (!raw || typeof raw !== 'object') {
    return createDefaultRepasseRule(fallbackAmountCents)
  }

  const obj = raw as Partial<EscalaRepasseRule>
  if (!obj.modalidade || !obj.criteriosPresenca) {
    return createDefaultRepasseRule(fallbackAmountCents)
  }

  return {
    modalidade: obj.modalidade,
    valorPlantaoCentavos: Number(obj.valorPlantaoCentavos ?? fallbackAmountCents),
    valorConsultaCentavos: Number(obj.valorConsultaCentavos ?? 0),
    ...(obj.percentualFixoHibrido != null
      ? { percentualFixoHibrido: Number(obj.percentualFixoHibrido) }
      : {}),
    criteriosPresenca: normalizeCriteriosPresenca(obj.criteriosPresenca),
  }
}

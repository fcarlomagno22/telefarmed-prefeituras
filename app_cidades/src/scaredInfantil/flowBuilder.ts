import { scaredContent } from './loadContent'
import type {
  ScaredConsentItem,
  ScaredFlowQuestion,
  ScaredFlowStepId,
  ScaredInformantTypeId,
  ScaredRespondentId,
} from './types'

type ScaleAnswer = { label: string; value: number | string }

const FUNCTIONAL_SCALES_WITH_PREAMBLE = new Set([
  'impairment_1_5',
  'frequency_1_5',
  'support_need_1_5',
  'mood_impact_1_5',
])

const SCALE_REGISTRY = new Map<string, ScaleAnswer[]>()

function registerScales(source: { answer_scales?: Array<{ id: string; answers: ScaleAnswer[] }> }) {
  for (const scale of source.answer_scales ?? []) {
    SCALE_REGISTRY.set(
      scale.id,
      scale.answers.map((answer) => ({ label: answer.label, value: answer.value })),
    )
  }
}

registerScales(scaredContent.questions)
registerScales(scaredContent.functionalImpairment)
registerScales(scaredContent.redFlags)
registerScales(scaredContent.differentialScreening)

function getScale(scaleId: string): ScaleAnswer[] {
  return SCALE_REGISTRY.get(scaleId) ?? []
}

function allowsRespondent(respondents: string[] | undefined, respondentId: ScaredRespondentId) {
  if (!respondents || respondents.length === 0) return true
  return respondents.includes(respondentId)
}

function inItemAgeRange(
  ageYears: number,
  item: { age_range?: { min: number; max: number }; parent_proxy_only_below_age?: number },
  respondentId: ScaredRespondentId,
) {
  if (respondentId === 'responsavel' && item.parent_proxy_only_below_age != null) {
    if (ageYears < item.parent_proxy_only_below_age) return true
  }
  if (!item.age_range) return true
  return ageYears >= item.age_range.min && ageYears <= item.age_range.max
}

function questionText(
  question: { question: string | Record<string, string> },
  respondentId: ScaredRespondentId,
) {
  if (typeof question.question === 'string') return question.question
  return question.question[respondentId] ?? question.question.responsavel ?? ''
}

function mapQuestions(
  items: Array<{
    id: string
    question: string | Record<string, string>
    answer_scale: string
    respondents?: string[]
    age_range?: { min: number; max: number }
    parent_proxy_only_below_age?: number
  }>,
  step: ScaredFlowStepId,
  ageYears: number,
  respondentId: ScaredRespondentId,
): ScaredFlowQuestion[] {
  return items
    .filter(
      (item) =>
        inItemAgeRange(ageYears, item, respondentId) &&
        allowsRespondent(item.respondents, respondentId),
    )
    .map((item) => ({
      id: item.id,
      step,
      text: questionText(item, respondentId),
      options: getScale(item.answer_scale),
    }))
    .filter((item) => item.text && item.options.length > 0)
}

const REQUIRED_CHECKBOX_TERM_MAP: Record<string, string> = {
  confirm_guardian_role: 'main_guardian_consent',
  accept_screening_not_diagnosis: 'non_diagnostic_notice',
  authorize_sensitive_data: 'sensitive_data_notice',
  understand_urgent_risk: 'crisis_notice',
}

function resolveConsentItem(
  id: string,
  label: string,
  required: boolean,
  termSetId?: string,
): ScaredConsentItem {
  const termSet = termSetId
    ? scaredContent.consentTerms.term_sets.find((term) => term.id === termSetId)
    : undefined

  return {
    id,
    label,
    summary: termSet?.summary,
    fullText: termSet?.full_text ?? label,
    acceptanceLabel: termSet?.acceptance_label ?? 'Li e aceito.',
    required,
  }
}

export function getScaredConsentItems(): ScaredConsentItem[] {
  const required = scaredContent.consentTerms.required_checkboxes.map((checkbox) =>
    resolveConsentItem(
      checkbox.id,
      checkbox.label,
      checkbox.required,
      REQUIRED_CHECKBOX_TERM_MAP[checkbox.id],
    ),
  )

  const optional = scaredContent.consentTerms.optional_checkboxes.map((checkbox) =>
    resolveConsentItem(checkbox.id, checkbox.label, false, checkbox.maps_to_term_set),
  )

  return [...required, ...optional]
}

export function getScaredConsentDisclaimer(): string {
  return scaredContent.consentTerms.metadata.diagnostic_disclaimer
}

export function getScaredDataCollectionNotice(): {
  title: string
  plainText: string
} {
  const notice = scaredContent.consentTerms.data_collection_notice
  return {
    title: notice.title,
    plainText: notice.plain_text,
  }
}

export function getScaredInformantOptions(ageYears: number) {
  return scaredContent.informants.informant_types
    .filter((item) => {
      if (item.id === 'professor') return false
      if (ageYears >= 4 && ageYears <= 7) {
        return item.can_start && item.respondent_id === 'responsavel'
      }
      if (ageYears >= 8 && ageYears <= 11) {
        return (
          (item.can_start && item.respondent_id === 'responsavel') ||
          item.id === 'crianca'
        )
      }
      if (ageYears >= 12 && ageYears <= 17) {
        return (
          (item.can_start && item.respondent_id === 'responsavel') ||
          item.id === 'adolescente'
        )
      }
      return false
    })
    .map((item) => ({
      id: item.id as ScaredInformantTypeId,
      label: item.label,
      respondentId: item.respondent_id as ScaredRespondentId,
      hint:
        item.id === 'crianca'
          ? 'Com apoio do responsável'
          : item.id === 'adolescente'
            ? 'Autorrelato preferencial'
            : undefined,
    }))
}

export function resolveScaredRespondentId(
  informantTypeId: ScaredInformantTypeId,
): ScaredRespondentId {
  const informant = scaredContent.informants.informant_types.find((item) => item.id === informantTypeId)
  if (informant?.respondent_id === 'crianca_adolescente') return 'crianca_adolescente'
  return 'responsavel'
}

export function buildScaredFlowQuestions(
  ageYears: number,
  respondentId: ScaredRespondentId,
): ScaredFlowQuestion[] {
  const scaredScale = scaredContent.questions.answer_scales.find(
    (scale) => scale.id === 'scared_frequency_0_2',
  )
  const scaredPreamble =
    scaredScale?.instructions?.[respondentId] ??
    'Nos últimos 3 meses, marque com que frequência cada frase aconteceu.'

  const scaredItems = mapQuestions(
    scaredContent.questions.items as Array<{
      id: string
      question: Record<string, string>
      answer_scale: string
      respondents?: string[]
      age_range?: { min: number; max: number }
      parent_proxy_only_below_age?: number
    }>,
    'scared',
    ageYears,
    respondentId,
  ).map((item, index) => ({
    ...item,
    preamble: index === 0 ? scaredPreamble : undefined,
  }))

  const functional = mapQuestions(
    scaredContent.functionalImpairment.questions as Array<{
      id: string
      question: Record<string, string>
      answer_scale: string
      respondents?: string[]
      age_range?: { min: number; max: number }
      parent_proxy_only_below_age?: number
    }>,
    'functional',
    ageYears,
    respondentId,
  ).map((item) => {
    const source = scaredContent.functionalImpairment.questions.find((q) => q.id === item.id)
    const scale = scaredContent.functionalImpairment.answer_scales.find(
      (s) => s.id === source?.answer_scale,
    )
    const scaleInstruction = scale?.instructions?.[respondentId]
    return FUNCTIONAL_SCALES_WITH_PREAMBLE.has(source?.answer_scale ?? '') && scaleInstruction
      ? { ...item, preamble: scaleInstruction }
      : item
  })

  const red = mapQuestions(
    scaredContent.redFlags.questions as Array<{
      id: string
      question: Record<string, string>
      answer_scale: string
      respondents?: string[]
    }>,
    'red_flags',
    ageYears,
    respondentId,
  ).map((item, index) => {
    const redScale = scaredContent.redFlags.answer_scales.find(
      (scale) => scale.id === 'red_flag_yes_no_unknown',
    )
    const redPreamble = redScale?.instructions?.[respondentId]
    return index === 0 && redPreamble ? { ...item, preamble: redPreamble } : item
  })

  const differential = mapQuestions(
    scaredContent.differentialScreening.questions as Array<{
      id: string
      question: Record<string, string>
      answer_scale: string
      respondents?: string[]
    }>,
    'differential',
    ageYears,
    respondentId,
  ).map((item) => {
    const source = scaredContent.differentialScreening.questions.find((q) => q.id === item.id)
    const scale = scaredContent.differentialScreening.answer_scales.find(
      (s) => s.id === source?.answer_scale,
    )
    const scaleInstruction = scale?.instructions?.[respondentId]
    return scaleInstruction ? { ...item, preamble: scaleInstruction } : item
  })

  return [...scaredItems, ...functional, ...red, ...differential]
}

export function getScaredStepLabel(step: ScaredFlowStepId): string {
  switch (step) {
    case 'consent':
      return 'Consentimento'
    case 'profile':
      return 'Sobre a criança'
    case 'informant':
      return 'Quem responde'
    case 'scared':
      return 'SCARED 41'
    case 'functional':
      return 'Prejuízo funcional'
    case 'red_flags':
      return 'Alertas de segurança'
    case 'differential':
      return 'Fatores associados'
    default:
      return 'Triagem'
  }
}

export const SCARED_FLOW_STEPS: ScaredFlowStepId[] = [
  'consent',
  'profile',
  'informant',
  'scared',
  'functional',
  'red_flags',
  'differential',
]

import { tdahTodContent } from './loadContent'
import type {
  TdahTodConsentItem,
  TdahTodConsentTerm,
  TdahTodFlowQuestion,
  TdahTodFlowStepId,
  TdahTodRespondentId,
} from './types'

type ScaleAnswer = { label: string; value: number | string }

const SCALE_REGISTRY = new Map<string, ScaleAnswer[]>()

function registerScales(source: { answer_scales?: Array<{ id: string; answers: ScaleAnswer[] }> }) {
  for (const scale of source.answer_scales ?? []) {
    SCALE_REGISTRY.set(
      scale.id,
      scale.answers.map((answer) => ({ label: answer.label, value: answer.value })),
    )
  }
}

registerScales(tdahTodContent.questions)
registerScales(tdahTodContent.functionalImpairment)
registerScales(tdahTodContent.redFlags)
registerScales(tdahTodContent.differentialScreening)

function getScale(scaleId: string): ScaleAnswer[] {
  return SCALE_REGISTRY.get(scaleId) ?? []
}

function inAgeRange(ageYears: number, range?: { min: number; max: number }) {
  if (!range) return true
  return ageYears >= range.min && ageYears <= range.max
}

function allowsRespondent(
  respondents: string[] | undefined,
  respondentId: TdahTodRespondentId,
) {
  if (!respondents || respondents.length === 0) return true
  return respondents.includes(respondentId)
}

function questionText(
  question: { question: string | Record<string, string> },
  respondentId: TdahTodRespondentId,
) {
  if (typeof question.question === 'string') return question.question
  return question.question[respondentId] ?? question.question.responsavel ?? ''
}

function mapQuestions(
  items: Array<{
    id: string
    question: string | Record<string, string>
    answer_scale: string
    respondent?: string[]
    age_range?: { min: number; max: number }
  }>,
  step: TdahTodFlowStepId,
  ageYears: number,
  respondentId: TdahTodRespondentId,
): TdahTodFlowQuestion[] {
  return items
    .filter(
      (item) =>
        inAgeRange(ageYears, item.age_range) && allowsRespondent(item.respondent, respondentId),
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
  authorize_sensitive_data: 'sensitive_data_consent',
  understand_urgent_risk: 'urgent_risk_notice',
}

function resolveConsentItem(
  id: string,
  label: string,
  required: boolean,
  termSetId?: string,
): TdahTodConsentItem {
  const termSet = termSetId
    ? tdahTodContent.consentTerms.term_sets.find((term) => term.id === termSetId)
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

export function getTdahTodConsentItems(): TdahTodConsentItem[] {
  const required = tdahTodContent.consentTerms.required_checkboxes.map((checkbox) =>
    resolveConsentItem(
      checkbox.id,
      checkbox.label,
      checkbox.required,
      REQUIRED_CHECKBOX_TERM_MAP[checkbox.id],
    ),
  )

  const optional = tdahTodContent.consentTerms.optional_checkboxes.map((checkbox) =>
    resolveConsentItem(checkbox.id, checkbox.label, false, checkbox.maps_to_term_set),
  )

  return [...required, ...optional]
}

export function getTdahTodConsentDisclaimer(): string {
  return tdahTodContent.consentTerms.metadata.diagnostic_disclaimer
}

export function getTdahTodDataCollectionNotice(): {
  title: string
  plainText: string
} {
  const notice = tdahTodContent.consentTerms.data_collection_notice
  return {
    title: notice.title,
    plainText: notice.plain_text,
  }
}

export function getTdahTodConsentTerms(): TdahTodConsentTerm[] {
  return tdahTodContent.consentTerms.term_sets
    .filter((term) => term.display_position === 'before_screening' && term.required)
    .map((term) => ({
      id: term.id,
      title: term.title,
      fullText: term.full_text,
      acceptanceLabel: term.acceptance_label,
      required: term.required,
    }))
}

export function getTdahTodInformantOptions() {
  return tdahTodContent.informants.informant_types
    .filter((item) => item.allowed_question_respondent_type === 'responsavel')
    .map((item) => ({
      id: item.id,
      label: item.label,
      group: item.group,
    }))
}

export function buildTdahTodFlowQuestions(
  ageYears: number,
  respondentId: TdahTodRespondentId,
): TdahTodFlowQuestion[] {
  const snapScale = tdahTodContent.questions.answer_scales.find(
    (scale) => scale.id === 'snap_frequency_0_3',
  )
  const snapPreamble =
    snapScale?.instructions?.[respondentId] ??
    'Considerando os últimos 6 meses, marque o quanto esse comportamento apareceu.'

  const snap = mapQuestions(
    tdahTodContent.questions.questions as Array<{
      id: string
      question: Record<string, string>
      answer_scale: string
      respondent?: string[]
      age_range?: { min: number; max: number }
    }>,
    'snap_iv',
    ageYears,
    respondentId,
  ).map((item, index) => ({
    ...item,
    preamble: index === 0 ? snapPreamble : undefined,
  }))

  const functional = mapQuestions(
    tdahTodContent.functionalImpairment.questions as Array<{
      id: string
      question: string
      answer_scale: string
      respondent?: string[]
      age_range?: { min: number; max: number }
    }>,
    'functional',
    ageYears,
    respondentId,
  )

  const red = mapQuestions(
    tdahTodContent.redFlags.questions as Array<{
      id: string
      question: string
      answer_scale: string
      respondent?: string[]
      age_range?: { min: number; max: number }
    }>,
    'red_flags',
    ageYears,
    respondentId,
  )

  const differential = mapQuestions(
    tdahTodContent.differentialScreening.questions as Array<{
      id: string
      question: string
      answer_scale: string
      respondent?: string[]
      age_range?: { min: number; max: number }
    }>,
    'differential',
    ageYears,
    respondentId,
  )

  return [...snap, ...functional, ...red, ...differential]
}

export function getTdahTodStepLabel(step: TdahTodFlowStepId): string {
  switch (step) {
    case 'consent':
      return 'Consentimento'
    case 'profile':
      return 'Sobre a criança'
    case 'informant':
      return 'Quem responde'
    case 'snap_iv':
      return 'SNAP-IV 26'
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

export const TDAH_TOD_FLOW_STEPS: TdahTodFlowStepId[] = [
  'consent',
  'profile',
  'informant',
  'snap_iv',
  'functional',
  'red_flags',
  'differential',
]

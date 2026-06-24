export type EmotionalScreeningTab = 'tests' | 'history'

export type EmotionalScreeningAudience =
  | 'adult_adolescent'
  | 'child_adolescent'
  | 'early_childhood'

export type EmotionalScreeningQuestionType = 'single' | 'yes_no'

export type EmotionalScreeningQuestionOption = {
  value: number | string
  label: string
}

export type EmotionalScreeningQuestion = {
  id: string
  text: string
  type: EmotionalScreeningQuestionType
  options?: EmotionalScreeningQuestionOption[]
  /** Marca itens de segurança (ex.: ideação suicida). */
  safetyCritical?: boolean
}

export type EmotionalScreeningInstrumentId =
  | 'gad-7'
  | 'phq-9'
  | 'cssrs'
  | 'asrs'
  | 'snap-iv'
  | 'scared'
  | 'psc-17'
  | 'mchat-r'
  | 'isi'
  | 'audit-c'
  | 'pcl-5'

export type EmotionalScreeningSeverityTone = 'calm' | 'attention' | 'elevated' | 'urgent'

export type EmotionalScreeningInstrument = {
  id: EmotionalScreeningInstrumentId
  title: string
  subtitle: string
  audience: EmotionalScreeningAudience
  audienceLabel: string
  instrumentCode: string
  estimatedMinutes: number
  icon: string
  accent: readonly [string, string]
  intro: string
  questionPreamble?: string
  questions: EmotionalScreeningQuestion[]
}

export type EmotionalScreeningAnswers = Record<string, number | string | boolean>

export type EmotionalScreeningResultBand = {
  id: string
  label: string
  description: string
  tone: EmotionalScreeningSeverityTone
}

export type EmotionalScreeningSubscaleResult = {
  id: string
  label: string
  score: number
  band: EmotionalScreeningResultBand
}

export type EmotionalScreeningComputedResult = {
  totalScore: number | null
  band: EmotionalScreeningResultBand
  subscales?: EmotionalScreeningSubscaleResult[]
  safetyTriggered: boolean
  safetyMessage?: string
  recommendations: string[]
}

export type EmotionalScreeningSessionRecord = {
  id: string
  instrumentId: EmotionalScreeningInstrumentId
  instrumentTitle: string
  completedAt: string
  answers: EmotionalScreeningAnswers
  result: EmotionalScreeningComputedResult
}

export type EmotionalScreeningStoreRecord = {
  sessions: EmotionalScreeningSessionRecord[]
}

export const EMOTIONAL_SCREENING_DISCLAIMER =
  'Este resultado indica sinais compatíveis e recomenda uma avaliação profissional. Não constitui diagnóstico.'

export const EMOTIONAL_SCREENING_AUDIENCE_LABELS: Record<EmotionalScreeningAudience, string> = {
  adult_adolescent: 'Adultos e adolescentes',
  child_adolescent: 'Crianças e adolescentes',
  early_childhood: '16 a 30 meses',
}

export function emptyEmotionalScreeningStoreRecord(): EmotionalScreeningStoreRecord {
  return { sessions: [] }
}

export type ScaredFlowStepId =
  | 'consent'
  | 'profile'
  | 'informant'
  | 'scared'
  | 'functional'
  | 'red_flags'
  | 'differential'

export type ScaredRespondentId = 'crianca_adolescente' | 'responsavel'

export type ScaredInformantTypeId =
  | 'mae'
  | 'pai'
  | 'responsavel_legal'
  | 'cuidador_principal'
  | 'crianca'
  | 'adolescente'

export type ScaredClassificationId =
  | 'baixo_indicativo'
  | 'sinais_leves'
  | 'sinais_moderados'
  | 'sinais_importantes'
  | 'prioridade_clinica'
  | 'pendente'
  | 'bloqueado'

export type ScaredSubscaleId =
  | 'panico_somatico'
  | 'ansiedade_generalizada'
  | 'ansiedade_separacao'
  | 'ansiedade_social'
  | 'evitacao_escolar'

export type ScaredAnswerValue = number | string

export type ScaredAnswers = Record<string, ScaredAnswerValue>

export type ScaredFlowQuestionOption = {
  label: string
  value: ScaredAnswerValue
}

export type ScaredFlowQuestion = {
  id: string
  step: ScaredFlowStepId
  text: string
  preamble?: string
  options: ScaredFlowQuestionOption[]
}

export type ScaredConsentItem = {
  id: string
  label: string
  summary?: string
  fullText: string
  acceptanceLabel: string
  required: boolean
}

export type ScaredSubscaleScore = {
  subscale: ScaredSubscaleId
  respondent: ScaredRespondentId
  label: string
  answeredItemCount: number
  positiveItemCount: number
  rawScore: number
  maxScore: number
  referenceCutoff: number
  scoreStatus: 'valid' | 'insuficiente'
  flag: 'relevant_signal' | 'subthreshold_signal' | 'low_signal' | 'insufficient_data'
  bandLabel: string
  aboveCutoff: boolean
}

export type ScaredRedFlagHit = {
  id: string
  severity: string
  question: string
  flags: string[]
}

export type ScaredReferral = {
  destination: string
  label: string
  priorityLevel: string | number
  reason: string
  required: boolean
  userMessage?: string
}

export type ScaredEngineResult = {
  moduleVersion: string
  disclaimer: string
  childAgeYears: number
  ageGroupId: string
  ageGroupLabel: string
  eligibility: string
  blocked: boolean
  blockMessage?: string
  informantTypeId: ScaredInformantTypeId
  respondentId: ScaredRespondentId
  confidence: 'baixa' | 'moderada' | 'maior'
  classificationId: ScaredClassificationId
  classificationLabel: string
  totalScore: number
  totalMaxScore: number
  subscaleScores: ScaredSubscaleScore[]
  elevatedSubscaleLabels: string[]
  functionalImpairmentLevel: string
  functionalImpairmentLabel: string
  redFlags: ScaredRedFlagHit[]
  urgentRedFlag: boolean
  safeguardingRedFlag: boolean
  differentialFlags: string[]
  differentialNote?: string
  informantNote?: string
  headline: string
  familySummary: string
  reassurance: string
  nextSteps: string[]
  referrals: ScaredReferral[]
  followupDays: number | null
  followupMessage?: string
  safeResultPhrase: string
  appliedRules: string[]
}

export type ScaredSessionRecord = {
  id: string
  childName?: string
  childAgeYears: number
  informantTypeId: ScaredInformantTypeId
  completedAt: string
  answers: ScaredAnswers
  consentsAccepted: string[]
  result: ScaredEngineResult
}

export type ScaredProfileInput = {
  childAgeYears: number
  childName?: string
  informantTypeId: ScaredInformantTypeId
  respondentId: ScaredRespondentId
}

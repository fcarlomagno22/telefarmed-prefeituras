export type TdahTodFlowStepId =
  | 'consent'
  | 'profile'
  | 'informant'
  | 'snap_iv'
  | 'functional'
  | 'red_flags'
  | 'differential'

export type TdahTodRespondentId = 'responsavel' | 'professor'

export type TdahTodInformantTypeId =
  | 'mae'
  | 'pai'
  | 'responsavel_legal'
  | 'cuidador_principal'
  | 'familiar_cuidador'
  | 'professor'
  | 'coordenador_escolar'
  | 'psicologo_pedagogo_escolar'

export type TdahTodClassificationId =
  | 'baixo_indicativo'
  | 'sinais_leves'
  | 'sinais_moderados'
  | 'sinais_importantes'
  | 'prioridade_clinica'
  | 'pendente'

export type TdahTodDomainId = 'desatencao' | 'hiperatividade_impulsividade' | 'oposicao_desafio'

export type TdahTodAnswerValue = number | string

export type TdahTodAnswers = Record<string, TdahTodAnswerValue>

export type TdahTodFlowQuestionOption = {
  label: string
  value: TdahTodAnswerValue
}

export type TdahTodFlowQuestion = {
  id: string
  step: TdahTodFlowStepId
  text: string
  preamble?: string
  options: TdahTodFlowQuestionOption[]
}

export type TdahTodConsentTerm = {
  id: string
  title: string
  fullText: string
  acceptanceLabel: string
  required: boolean
}

export type TdahTodConsentItem = {
  id: string
  label: string
  summary?: string
  fullText: string
  acceptanceLabel: string
  required: boolean
}

export type TdahTodDomainScore = {
  domain: TdahTodDomainId
  respondent: TdahTodRespondentId
  answeredItemCount: number
  positiveItemCount: number
  rawScore: number
  meanScore: number
  scoreStatus: 'valid' | 'insuficiente'
  flag: 'relevant_signal' | 'subthreshold_signal' | 'low_signal' | 'insufficient_data'
  bandId: string
  bandLabel: string
}

export type TdahTodRedFlagHit = {
  id: string
  severity: string
  question: string
  flags: string[]
}

export type TdahTodReferral = {
  destination: string
  label: string
  priorityLevel: string
  reason: string
  required: boolean
}

export type TdahTodEngineResult = {
  moduleVersion: string
  disclaimer: string
  childAgeYears: number
  ageGroupId: string
  ageGroupLabel: string
  eligibility: string
  blocked: boolean
  blockMessage?: string
  informantTypeId: TdahTodInformantTypeId
  respondentId: TdahTodRespondentId
  availableRespondents: TdahTodRespondentId[]
  confidence: 'baixa' | 'moderada' | 'maior'
  classificationId: TdahTodClassificationId
  classificationLabel: string
  profileLabels: string[]
  profilePhrases: string[]
  domainScores: TdahTodDomainScore[]
  functionalImpairmentLevel: string
  functionalImpairmentLabel: string
  redFlags: TdahTodRedFlagHit[]
  urgentRedFlag: boolean
  safeguardingRedFlag: boolean
  differentialFlags: string[]
  differentialNote?: string
  informantNote?: string
  headline: string
  familySummary: string
  reassurance: string
  nextSteps: string[]
  referrals: TdahTodReferral[]
  followupDays: number | null
  followupMessage?: string
  schoolFormRecommended: boolean
  safeResultPhrase: string
  appliedRules: string[]
}

export type TdahTodSessionRecord = {
  id: string
  childName?: string
  childAgeYears: number
  informantTypeId: TdahTodInformantTypeId
  completedAt: string
  answers: TdahTodAnswers
  consentsAccepted: string[]
  result: TdahTodEngineResult
}

export type TdahTodProfileInput = {
  childAgeYears: number
  childName?: string
  informantTypeId: TdahTodInformantTypeId
  respondentId: TdahTodRespondentId
  professorAnswers?: TdahTodAnswers
}

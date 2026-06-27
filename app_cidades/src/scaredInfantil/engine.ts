import { scaredContent } from './loadContent'
import type {
  ScaredAnswers,
  ScaredClassificationId,
  ScaredEngineResult,
  ScaredProfileInput,
  ScaredRedFlagHit,
  ScaredReferral,
  ScaredRespondentId,
  ScaredSubscaleId,
  ScaredSubscaleScore,
} from './types'

const POSITIVE_SCARED = new Set([1, 2])
const MINIMUM_TOTAL_ITEMS = 35
const SUBSCALE_MINIMUM_ITEMS: Record<ScaredSubscaleId, number> = {
  panico_somatico: 10,
  ansiedade_generalizada: 7,
  ansiedade_separacao: 7,
  ansiedade_social: 3,
  evitacao_escolar: 5,
}

const FUNCTIONAL_SCORING_SCALES = new Set([
  'impairment_1_5',
  'frequency_1_5',
  'support_need_1_5',
  'mood_impact_1_5',
])

function isYes(value: unknown) {
  return value === 'yes' || value === 1 || value === true
}

function numericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return null
}

function itemIdByNumber(itemNumber: number) {
  return `scared_q${String(itemNumber).padStart(2, '0')}`
}

function resolveAgeGroup(ageYears: number) {
  if (ageYears < 4 || ageYears > 17) {
    return scaredContent.ageRules.age_groups.find((group) => group.id === 'fora_faixa')!
  }
  if (ageYears <= 7) {
    return scaredContent.ageRules.age_groups.find((group) => group.id === '4_7_proxy_only')!
  }
  if (ageYears <= 11) {
    return scaredContent.ageRules.age_groups.find((group) => group.id === '8_11_misto')!
  }
  if (ageYears <= 14) {
    return scaredContent.ageRules.age_groups.find((group) => group.id === '12_14_adolescencia_inicial')!
  }
  return scaredContent.ageRules.age_groups.find((group) => group.id === '15_17_adolescencia')!
}

function scoreSubscale(
  subscaleId: ScaredSubscaleId,
  respondent: ScaredRespondentId,
  answers: ScaredAnswers,
): ScaredSubscaleScore {
  const meta = scaredContent.questions.subscales.find((item) => item.id === subscaleId)!
  const questionIds = meta.item_numbers.map((number) => itemIdByNumber(number))
  const answered = questionIds.filter((id) => numericValue(answers[id]) != null)
  const values = answered.map((id) => numericValue(answers[id])!)
  const positiveItemCount = values.filter((value) => POSITIVE_SCARED.has(value)).length
  const rawScore = values.reduce((sum, value) => sum + value, 0)
  const minimumAnswered = SUBSCALE_MINIMUM_ITEMS[subscaleId]
  const referenceCutoff = meta.reference_cutoff
  const maxScore = meta.max_score

  if (answered.length < minimumAnswered) {
    return {
      subscale: subscaleId,
      respondent,
      label: meta.label,
      answeredItemCount: answered.length,
      positiveItemCount,
      rawScore,
      maxScore,
      referenceCutoff,
      scoreStatus: 'insuficiente',
      flag: 'insufficient_data',
      bandLabel: 'Dados insuficientes',
      aboveCutoff: false,
    }
  }

  const aboveCutoff = rawScore >= referenceCutoff
  let flag: ScaredSubscaleScore['flag'] = 'low_signal'
  let bandLabel = 'Baixo indicativo'

  if (aboveCutoff) {
    flag = 'relevant_signal'
    bandLabel = 'Acima do cutoff de referência'
  } else if (rawScore >= referenceCutoff * 0.6) {
    flag = 'subthreshold_signal'
    bandLabel = 'Sinais intermediários'
  }

  return {
    subscale: subscaleId,
    respondent,
    label: meta.label,
    answeredItemCount: answered.length,
    positiveItemCount,
    rawScore,
    maxScore,
    referenceCutoff,
    scoreStatus: 'valid',
    flag,
    bandLabel,
    aboveCutoff,
  }
}

function scoreTotal(respondent: ScaredRespondentId, answers: ScaredAnswers) {
  const questionIds = scaredContent.questions.items.map((item) => item.id)
  const answered = questionIds.filter((id) => numericValue(answers[id]) != null)
  const values = answered.map((id) => numericValue(answers[id])!)
  const rawScore = values.reduce((sum, value) => sum + value, 0)
  return {
    rawScore,
    answeredCount: answered.length,
    valid: answered.length >= MINIMUM_TOTAL_ITEMS,
  }
}

function scoreFunctionalImpairment(respondent: ScaredRespondentId, answers: ScaredAnswers) {
  const questions = scaredContent.functionalImpairment.questions.filter((item) =>
    item.respondents?.includes(respondent),
  )
  const values: number[] = []

  for (const question of questions) {
    const value = numericValue(answers[question.id])
    if (value == null) continue
    if (FUNCTIONAL_SCORING_SCALES.has(question.answer_scale)) {
      values.push(value)
    }
  }

  const countGte4 = values.filter((value) => value >= 4).length
  const countGte3 = values.filter((value) => value >= 3).length
  const anyEq5 = values.some((value) => value === 5)
  const countGte2 = values.filter((value) => value >= 2).length

  let levelId = 'sem_prejuizo'
  if (countGte4 >= 2 || anyEq5) {
    levelId = 'importante'
  } else if (countGte3 >= 2) {
    levelId = 'moderado'
  } else if (countGte2 >= 1) {
    levelId = 'leve'
  }

  const level =
    scaredContent.functionalImpairment.functional_impairment_levels.find(
      (item) => item.id === levelId,
    ) ?? scaredContent.functionalImpairment.functional_impairment_levels[0]

  return { levelId, label: level.label }
}

function scoreRedFlags(answers: ScaredAnswers): {
  hits: ScaredRedFlagHit[]
  urgentRedFlag: boolean
  safeguardingRedFlag: boolean
  highestSeverity: 'none' | 'cautela' | 'urgente' | 'salvaguarda'
} {
  const hits: ScaredRedFlagHit[] = []
  let urgentRedFlag = false
  let safeguardingRedFlag = false
  let highestSeverity: 'none' | 'cautela' | 'urgente' | 'salvaguarda' = 'none'

  const severityRank = { none: 0, cautela: 1, urgente: 2, salvaguarda: 3 }

  for (const question of scaredContent.redFlags.questions) {
    if (!isYes(answers[question.id])) continue
    const severity = question.severity_minimum ?? 'cautela'
    if (severity === 'urgente') urgentRedFlag = true
    if (severity === 'salvaguarda') safeguardingRedFlag = true
    if (severityRank[severity as keyof typeof severityRank] > severityRank[highestSeverity]) {
      highestSeverity = severity as typeof highestSeverity
    }
    const text =
      typeof question.question === 'string'
        ? question.question
        : question.question.responsavel
    hits.push({
      id: question.id,
      severity,
      question: text,
      flags: [question.clinical_construct ?? question.id],
    })
  }

  return { hits, urgentRedFlag, safeguardingRedFlag, highestSeverity }
}

function scoreDifferentials(answers: ScaredAnswers) {
  const flags: string[] = []
  for (const question of scaredContent.differentialScreening.questions) {
    const value = answers[question.id]
    const numeric = numericValue(value)
    const positive = isYes(value) || (numeric != null && numeric >= 2)
    if (positive && question.differential_flag_id) {
      flags.push(question.differential_flag_id)
    }
  }
  return [...new Set(flags)]
}

function resolveClassification(input: {
  totalScore: number
  totalValid: boolean
  subscaleScores: ScaredSubscaleScore[]
  functionalLevelId: string
  urgentRedFlag: boolean
  safeguardingRedFlag: boolean
}): ScaredClassificationId {
  if (!input.totalValid) return 'pendente'

  if (input.urgentRedFlag || input.safeguardingRedFlag) {
    return 'prioridade_clinica'
  }

  const anySubscaleAbove = input.subscaleScores.some((item) => item.aboveCutoff)
  const impairment = input.functionalLevelId

  if (input.totalScore >= 25) {
    if (impairment === 'moderado' || impairment === 'importante') return 'sinais_importantes'
    return 'sinais_moderados'
  }

  if (input.totalScore >= 15 && input.totalScore < 25) {
    if (impairment === 'moderado' || impairment === 'importante') return 'sinais_moderados'
    return 'sinais_leves'
  }

  if (anySubscaleAbove) {
    if (impairment === 'moderado' || impairment === 'importante') return 'sinais_moderados'
    if (impairment === 'leve') return 'sinais_leves'
  }

  if (input.totalScore < 15 && !anySubscaleAbove) return 'baixo_indicativo'

  return 'sinais_leves'
}

function resolveReferrals(context: {
  classificationId: ScaredClassificationId
  highestSeverity: 'none' | 'cautela' | 'urgente' | 'salvaguarda'
  redFlagIds: string[]
  subscaleAboveCutoff: Record<string, boolean>
  functionalAnswers: ScaredAnswers
}): ScaredReferral[] {
  const referrals: ScaredReferral[] = []
  const seen = new Set<string>()
  const rules = [...scaredContent.referralRules.referral_rules].sort(
    (a, b) => a.priority - b.priority,
  )

  const pushReferrals = (items: ScaredReferral[]) => {
    for (const item of items) {
      if (seen.has(item.destination)) continue
      seen.add(item.destination)
      referrals.push(item)
    }
  }

  for (const rule of rules) {
    const condition = rule.condition
    let match = false

    if (
      condition.includes('salvaguarda') &&
      (context.highestSeverity === 'salvaguarda' ||
        context.redFlagIds.includes('rf_abuso_violencia'))
    ) {
      match = true
    } else if (condition.includes('red_flag_highest_severity == urgente') && context.highestSeverity === 'urgente') {
      match = true
    } else if (
      condition.includes('classification_id == prioridade_clinica') &&
      context.classificationId === 'prioridade_clinica'
    ) {
      match = condition.includes('NOT IN')
        ? context.highestSeverity !== 'urgente' && context.highestSeverity !== 'salvaguarda'
        : condition.includes('urgente') && context.highestSeverity === 'urgente'
          ? true
          : !condition.includes('red_flag_highest_severity')
    } else if (
      condition.includes('classification_id == sinais_importantes') &&
      context.classificationId === 'sinais_importantes'
    ) {
      match = true
    } else if (
      condition.includes('classification_id == sinais_moderados') &&
      context.classificationId === 'sinais_moderados'
    ) {
      match = true
    } else if (
      condition.includes('classification_id == sinais_leves') &&
      context.classificationId === 'sinais_leves'
    ) {
      match = true
    } else if (
      condition.includes('classification_id == baixo_indicativo') &&
      context.classificationId === 'baixo_indicativo'
    ) {
      match = true
    } else if (
      condition.includes('evitacao_escolar') &&
      context.subscaleAboveCutoff.evitacao_escolar &&
      numericValue(context.functionalAnswers.func_escola_faltas) != null &&
      numericValue(context.functionalAnswers.func_escola_faltas)! >= 3
    ) {
      match = true
    }

    if (!match) continue
    pushReferrals(
      rule.outputs.referrals.map((ref) => ({
        destination: ref.destination,
        label: ref.label,
        priorityLevel: ref.priority_level,
        reason: ref.reason,
        required: ref.required,
        userMessage: ref.user_message,
      })),
    )
    if (rule.priority <= 2) break
  }

  return referrals
}

function resolveFollowup(classificationId: ScaredClassificationId) {
  const plan = scaredContent.followupRules.followup_schedule.find(
    (item) => item.classification_id === classificationId,
  )
  const messageKey = plan?.message_key
  const followupMessageEntry =
    messageKey && scaredContent.followupRules.followup_messages
      ? scaredContent.followupRules.followup_messages[
          messageKey as keyof typeof scaredContent.followupRules.followup_messages
        ]
      : undefined
  return {
    days: plan?.followup_days ?? null,
    message: followupMessageEntry?.message ?? plan?.action,
  }
}

function resolveConfidence(
  ageGroupId: string,
  respondentId: ScaredRespondentId,
  totalValid: boolean,
  differentialCount: number,
): ScaredEngineResult['confidence'] {
  if (!totalValid) return 'baixa'
  let confidence: ScaredEngineResult['confidence'] = 'moderada'
  if (ageGroupId === '15_17_adolescencia' && respondentId === 'crianca_adolescente') {
    confidence = 'maior'
  }
  if (ageGroupId === '4_7_proxy_only') confidence = 'moderada'
  if (differentialCount > 0 && confidence === 'maior') confidence = 'moderada'
  if (differentialCount > 2) confidence = 'baixa'
  return confidence
}

export function runScaredEngine(
  answers: ScaredAnswers,
  profile: ScaredProfileInput,
): ScaredEngineResult {
  const appliedRules: string[] = []
  const disclaimer =
    scaredContent.questions.metadata.diagnostic_disclaimer ??
    'O resultado não fecha diagnóstico. Ele identifica sinais compatíveis e orienta o melhor encaminhamento.'

  const ageGroup = resolveAgeGroup(profile.childAgeYears)
  appliedRules.push(`age_group:${ageGroup.id}`)

  if (ageGroup.eligibility === 'blocked') {
    const statusMsg = scaredContent.resultMessages.status_messages.bloqueado
    return {
      moduleVersion: scaredContent.questions.metadata.version,
      disclaimer,
      childAgeYears: profile.childAgeYears,
      ageGroupId: ageGroup.id,
      ageGroupLabel: ageGroup.label,
      eligibility: ageGroup.eligibility,
      blocked: true,
      blockMessage: ageGroup.messages?.respondent_guidance,
      informantTypeId: profile.informantTypeId,
      respondentId: profile.respondentId,
      confidence: 'baixa',
      classificationId: 'bloqueado',
      classificationLabel: 'Bloqueado',
      totalScore: 0,
      totalMaxScore: 82,
      subscaleScores: [],
      elevatedSubscaleLabels: [],
      functionalImpairmentLevel: 'sem_prejuizo',
      functionalImpairmentLabel: 'Sem prejuízo funcional relevante',
      redFlags: [],
      urgentRedFlag: false,
      safeguardingRedFlag: false,
      differentialFlags: [],
      headline: statusMsg.headline,
      familySummary: statusMsg.family_summary,
      reassurance: disclaimer,
      nextSteps: statusMsg.next_steps ?? [],
      referrals: [],
      followupDays: null,
      safeResultPhrase: statusMsg.family_summary,
      appliedRules,
    }
  }

  if (
    profile.childAgeYears <= 7 &&
    profile.respondentId === 'crianca_adolescente'
  ) {
    const statusMsg = scaredContent.resultMessages.status_messages.bloqueado
    return {
      moduleVersion: scaredContent.questions.metadata.version,
      disclaimer,
      childAgeYears: profile.childAgeYears,
      ageGroupId: ageGroup.id,
      ageGroupLabel: ageGroup.label,
      eligibility: 'blocked',
      blocked: true,
      blockMessage: 'Para 4 a 7 anos, apenas o responsável deve responder.',
      informantTypeId: profile.informantTypeId,
      respondentId: profile.respondentId,
      confidence: 'baixa',
      classificationId: 'bloqueado',
      classificationLabel: 'Bloqueado',
      totalScore: 0,
      totalMaxScore: 82,
      subscaleScores: [],
      elevatedSubscaleLabels: [],
      functionalImpairmentLevel: 'sem_prejuizo',
      functionalImpairmentLabel: 'Sem prejuízo funcional relevante',
      redFlags: [],
      urgentRedFlag: false,
      safeguardingRedFlag: false,
      differentialFlags: [],
      headline: statusMsg.headline,
      familySummary: 'Para crianças de 4 a 7 anos, a triagem deve ser respondida pelo responsável.',
      reassurance: disclaimer,
      nextSteps: statusMsg.next_steps ?? [],
      referrals: [],
      followupDays: null,
      safeResultPhrase: statusMsg.family_summary,
      appliedRules,
    }
  }

  const redFlagResult = scoreRedFlags(answers)
  appliedRules.push('red_flags_screened')

  const subscaleIds: ScaredSubscaleId[] = [
    'panico_somatico',
    'ansiedade_generalizada',
    'ansiedade_separacao',
    'ansiedade_social',
    'evitacao_escolar',
  ]
  const subscaleScores = subscaleIds.map((subscale) =>
    scoreSubscale(subscale, profile.respondentId, answers),
  )
  const total = scoreTotal(profile.respondentId, answers)
  const functional = scoreFunctionalImpairment(profile.respondentId, answers)
  const differentialFlags = scoreDifferentials(answers)

  if (differentialFlags.length > 0) {
    appliedRules.push('differential_flags_present')
  }

  const classificationId = resolveClassification({
    totalScore: total.rawScore,
    totalValid: total.valid,
    subscaleScores,
    functionalLevelId: functional.levelId,
    urgentRedFlag: redFlagResult.urgentRedFlag,
    safeguardingRedFlag: redFlagResult.safeguardingRedFlag,
  })
  appliedRules.push(`classification:${classificationId}`)

  const classificationMeta = scaredContent.cutoffs.classification_scale.find(
    (item) => item.id === classificationId,
  )
  const messageMeta =
    scaredContent.resultMessages.classification_messages.find(
      (item) => item.classification_id === classificationId,
    ) ??
    (classificationId === 'pendente' || classificationId === 'bloqueado'
      ? scaredContent.resultMessages.status_messages[classificationId]
      : undefined)

  if (!classificationMeta || !messageMeta) {
    throw new Error(`Classificação SCARED sem metadados: ${classificationId}`)
  }

  const elevatedSubscaleLabels = subscaleScores
    .filter((item) => item.aboveCutoff)
    .map((item) => item.label)

  const subscaleAboveCutoff = Object.fromEntries(
    subscaleScores.map((item) => [item.subscale, item.aboveCutoff]),
  ) as Record<string, boolean>

  const informantNote =
    profile.respondentId === 'crianca_adolescente'
      ? ageGroup.id === '8_11_misto'
        ? 'Este resultado reflete o autorrelato da criança. Quando possível, compare com a observação do responsável.'
        : 'Este resultado reflete o autorrelato do adolescente.'
      : ageGroup.id === '4_7_proxy_only'
        ? 'Este resultado reflete a observação do responsável, recomendada para crianças de 4 a 7 anos.'
        : 'Este resultado reflete principalmente a observação do responsável.'

  const differentialNote =
    differentialFlags.length > 0
      ? scaredContent.resultMessages.global_disclaimers.multi_informant_note
      : undefined

  const referrals = resolveReferrals({
    classificationId,
    highestSeverity: redFlagResult.highestSeverity,
    redFlagIds: redFlagResult.hits.map((item) => item.id),
    subscaleAboveCutoff,
    functionalAnswers: answers,
  })

  const followup = resolveFollowup(classificationId)
  const confidence = resolveConfidence(
    ageGroup.id,
    profile.respondentId,
    total.valid,
    differentialFlags.length,
  )

  const elevatedNotes = elevatedSubscaleLabels.length
    ? `Subescalas com destaque: ${elevatedSubscaleLabels.join(', ')}.`
    : null

  const safeResultPhrase = [
    messageMeta.family_summary,
    elevatedNotes,
    functional.levelId !== 'sem_prejuizo'
      ? `Há impacto relatado na rotina (${functional.label.toLowerCase()}).`
      : null,
    informantNote,
    differentialNote,
    disclaimer,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    moduleVersion: scaredContent.questions.metadata.version,
    disclaimer,
    childAgeYears: profile.childAgeYears,
    ageGroupId: ageGroup.id,
    ageGroupLabel: ageGroup.label,
    eligibility: ageGroup.eligibility,
    blocked: false,
    informantTypeId: profile.informantTypeId,
    respondentId: profile.respondentId,
    confidence,
    classificationId,
    classificationLabel: classificationMeta.label,
    totalScore: total.rawScore,
    totalMaxScore: 82,
    subscaleScores,
    elevatedSubscaleLabels,
    functionalImpairmentLevel: functional.levelId,
    functionalImpairmentLabel: functional.label,
    redFlags: redFlagResult.hits,
    urgentRedFlag: redFlagResult.urgentRedFlag,
    safeguardingRedFlag: redFlagResult.safeguardingRedFlag,
    differentialFlags,
    differentialNote,
    informantNote,
    headline: messageMeta.headline,
    familySummary: messageMeta.family_summary,
    reassurance:
      'reassurance' in messageMeta && typeof messageMeta.reassurance === 'string'
        ? messageMeta.reassurance
        : disclaimer,
    nextSteps: messageMeta.next_steps ?? [],
    referrals,
    followupDays: followup.days,
    followupMessage: followup.message,
    safeResultPhrase,
    appliedRules,
  }
}

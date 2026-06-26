import { tdahTodContent } from './loadContent'
import type {
  TdahTodAnswers,
  TdahTodClassificationId,
  TdahTodDomainId,
  TdahTodDomainScore,
  TdahTodEngineResult,
  TdahTodProfileInput,
  TdahTodRedFlagHit,
  TdahTodReferral,
  TdahTodRespondentId,
} from './types'

const POSITIVE_SNAP = new Set([2, 3])
const SAFEGUARDING_CATEGORIES = new Set([
  'abuso_violencia_negligencia',
  'risco_agressao_violencia',
])

function isYes(value: unknown) {
  return value === 'yes' || value === 1 || value === true
}

function numericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return null
}

function resolveAgeGroup(ageYears: number) {
  const group =
    tdahTodContent.ageRules.age_groups.find((item) => {
      const range = item.age_range
      if (range.inclusive_max) {
        return ageYears >= range.min && ageYears <= range.max
      }
      return ageYears >= range.min && ageYears < range.max
    }) ?? tdahTodContent.ageRules.age_groups.find((item) => item.id === 'age_18_or_more_not_child_module')

  return group!
}

function scoreDomain(
  domain: TdahTodDomainId,
  respondent: TdahTodRespondentId,
  answers: TdahTodAnswers,
): TdahTodDomainScore {
  const rule = tdahTodContent.scoringRules.domain_rules.find((item) => item.domain === domain)!
  const questionIds = rule.question_ids
  const answered = questionIds.filter((id) => numericValue(answers[id]) != null)
  const values = answered.map((id) => numericValue(answers[id])!)
  const positiveItemCount = values.filter((value) => POSITIVE_SNAP.has(value)).length
  const rawScore = values.reduce((sum, value) => sum + value, 0)
  const meanScore = answered.length > 0 ? rawScore / answered.length : 0
  const minimumAnswered = rule.minimum_answered_items_for_valid_score

  if (answered.length < minimumAnswered) {
    return {
      domain,
      respondent,
      answeredItemCount: answered.length,
      positiveItemCount,
      rawScore,
      meanScore,
      scoreStatus: 'insuficiente',
      flag: 'insufficient_data',
      bandId: rule.flags.insufficient_data,
      bandLabel: 'Dados insuficientes',
    }
  }

  let flag: TdahTodDomainScore['flag'] = 'low_signal'
  let bandId = rule.flags.low_signal
  let bandLabel = 'Baixo indicativo'

  if (positiveItemCount >= rule.minimum_positive_items_for_relevant_signal) {
    flag = 'relevant_signal'
    bandId = rule.flags.relevant_signal
    bandLabel = 'Sinais relevantes'
  } else if (positiveItemCount > (rule.domain_score_bands[0]?.positive_items_max ?? 2)) {
    flag = 'subthreshold_signal'
    bandId = rule.flags.subthreshold_signal
    bandLabel = 'Sinais leves/intermediários'
  }

  return {
    domain,
    respondent,
    answeredItemCount: answered.length,
    positiveItemCount,
    rawScore,
    meanScore,
    scoreStatus: 'valid',
    flag,
    bandId,
    bandLabel,
  }
}

function scoreFunctionalImpairment(respondent: TdahTodRespondentId, answers: TdahTodAnswers) {
  const questions = tdahTodContent.functionalImpairment.questions.filter((item) =>
    item.respondent?.includes(respondent),
  )
  let impairmentCount = 0
  let importantCount = 0

  for (const question of questions) {
    const value = numericValue(answers[question.id])
    if (value == null) continue
    if (question.answer_scale === 'performance_1_5') {
      if (value >= 4) impairmentCount += 1
      if (value >= 5) importantCount += 1
    }
    if (question.answer_scale === 'impact_frequency_0_3') {
      if (value >= 2) impairmentCount += 1
      if (value >= 3) importantCount += 1
    }
  }

  const levels = tdahTodContent.functionalImpairment.functional_impairment_levels
  let levelId = 'sem_prejuizo_relevante'

  if (importantCount >= 2 || impairmentCount >= 4 || answers.imp_parent_safety_14 === 5) {
    levelId = 'prejuizo_importante'
  } else if (impairmentCount >= 2 || importantCount >= 1) {
    levelId = 'prejuizo_moderado'
  } else if (impairmentCount === 1) {
    levelId = 'prejuizo_leve'
  }

  const level = levels.find((item) => item.id === levelId) ?? levels[0]
  return { levelId, label: level.label, impairmentCount, importantCount }
}

function scoreRedFlags(answers: TdahTodAnswers): {
  hits: TdahTodRedFlagHit[]
  urgentRedFlag: boolean
  safeguardingRedFlag: boolean
  anyRedFlag: boolean
} {
  const hits: TdahTodRedFlagHit[] = []
  let urgentRedFlag = false
  let safeguardingRedFlag = false

  for (const question of tdahTodContent.redFlags.questions) {
    if (!isYes(answers[question.id])) continue
    const severity = question.severity_if_yes ?? 'contextual'
    if (severity === 'urgente') urgentRedFlag = true
    if (
      severity === 'rede_protecao' ||
      SAFEGUARDING_CATEGORIES.has(question.category)
    ) {
      safeguardingRedFlag = true
    }
    hits.push({
      id: question.id,
      severity,
      question: question.question,
      flags: question.if_yes_flags ?? [],
    })
  }

  return {
    hits,
    urgentRedFlag,
    safeguardingRedFlag,
    anyRedFlag: hits.length > 0,
  }
}

function scoreDifferentials(answers: TdahTodAnswers) {
  const flags: string[] = []
  for (const question of tdahTodContent.differentialScreening.questions) {
    const value = answers[question.id]
    if (question.answer_scale === 'yes_no_unknown' && isYes(value)) {
      for (const flag of question.if_positive_flags ?? []) flags.push(flag)
      continue
    }
    const numeric = numericValue(value)
    if (numeric != null && numeric >= 2) {
      for (const flag of question.if_positive_flags ?? []) flags.push(flag)
    }
  }
  return [...new Set(flags)]
}

function rankClassification(id: TdahTodClassificationId): number {
  const item = tdahTodContent.cutoffs.classification_scale.find((entry) => entry.id === id)
  return item?.rank ?? -1
}

function pickHigher(
  current: TdahTodClassificationId,
  candidate: TdahTodClassificationId,
): TdahTodClassificationId {
  return rankClassification(candidate) > rankClassification(current) ? candidate : current
}

function pickLower(
  current: TdahTodClassificationId,
  candidate: TdahTodClassificationId,
): TdahTodClassificationId {
  if (rankClassification(candidate) < 0) return current
  if (rankClassification(current) < 0) return candidate
  return rankClassification(candidate) < rankClassification(current) ? candidate : current
}

function resolveProfiles(vars: {
  desatencaoRelevant: boolean
  hyperRelevant: boolean
  oddRelevant: boolean
}) {
  const profiles: Array<{ id: string; label: string; phrase: string }> = []
  for (const profile of tdahTodContent.cutoffs.profile_cutoffs) {
    if (profile.id === 'perfil_sem_predominio_claro' && !vars.desatencaoRelevant && !vars.hyperRelevant && !vars.oddRelevant) {
      profiles.push({
        id: profile.id,
        label: profile.label,
        phrase: profile.safe_phrase,
      })
    }
    if (profile.id === 'perfil_desatencao' && vars.desatencaoRelevant && !vars.hyperRelevant) {
      profiles.push({ id: profile.id, label: profile.label, phrase: profile.safe_phrase })
    }
    if (profile.id === 'perfil_hiperatividade_impulsividade' && vars.hyperRelevant && !vars.desatencaoRelevant) {
      profiles.push({ id: profile.id, label: profile.label, phrase: profile.safe_phrase })
    }
    if (profile.id === 'perfil_combinado_atencao_impulsividade' && vars.desatencaoRelevant && vars.hyperRelevant) {
      profiles.push({ id: profile.id, label: profile.label, phrase: profile.safe_phrase })
    }
    if (profile.id === 'perfil_oposicao_desafio_associado' && vars.oddRelevant) {
      profiles.push({ id: profile.id, label: profile.label, phrase: profile.safe_phrase })
    }
    if (
      profile.id === 'perfil_tdah_com_oposicao_associada' &&
      (vars.desatencaoRelevant || vars.hyperRelevant) &&
      vars.oddRelevant
    ) {
      profiles.push({ id: profile.id, label: profile.label, phrase: profile.safe_phrase })
    }
  }
  return profiles
}

function resolveReferrals(context: {
  classificationId: TdahTodClassificationId
  urgentRedFlag: boolean
  safeguardingRedFlag: boolean
  ageGroupId: string
  differentialFlags: string[]
  schoolFormRecommended: boolean
}): TdahTodReferral[] {
  const destinations = new Map(
    tdahTodContent.referralRules.referral_destinations.map((item) => [item.id, item]),
  )
  const referrals: TdahTodReferral[] = []
  const rules = [...tdahTodContent.referralRules.automatic_referral_rules].sort(
    (a, b) => b.priority - a.priority,
  )

  for (const rule of rules) {
    const condition = rule.condition
    const match =
      (condition === 'urgent_red_flag == true' && context.urgentRedFlag) ||
      (condition === 'safeguarding_red_flag == true' && context.safeguardingRedFlag) ||
      (condition === "age_group_id == under_4_not_eligible" && context.ageGroupId === 'under_4_not_eligible') ||
      (condition === 'classification_id == pendente' && context.classificationId === 'pendente') ||
      (condition === 'classification_id == baixo_indicativo AND urgent_red_flag == false' &&
        context.classificationId === 'baixo_indicativo' &&
        !context.urgentRedFlag) ||
      (condition === 'classification_id == sinais_leves AND urgent_red_flag == false' &&
        context.classificationId === 'sinais_leves' &&
        !context.urgentRedFlag) ||
      (condition === 'classification_id == sinais_moderados AND urgent_red_flag == false' &&
        context.classificationId === 'sinais_moderados' &&
        !context.urgentRedFlag) ||
      (condition === 'classification_id == sinais_importantes AND urgent_red_flag == false' &&
        context.classificationId === 'sinais_importantes' &&
        !context.urgentRedFlag) ||
      (condition === 'classification_id == prioridade_clinica' && context.classificationId === 'prioridade_clinica')

    if (!match) continue

    for (const ref of rule.referrals) {
      const destination = destinations.get(ref.destination)
      if (!destination) continue
      referrals.push({
        destination: ref.destination,
        label: destination.label,
        priorityLevel: ref.priority_level,
        reason: ref.reason,
        required: ref.required,
      })
    }

    if (rule.block_lower_priority_referrals_as_main_result) break
  }

  if (context.schoolFormRecommended && !referrals.some((item) => item.destination === 'formulario_escola')) {
    const destination = destinations.get('formulario_escola')
    if (destination) {
      referrals.push({
        destination: 'formulario_escola',
        label: destination.label,
        priorityLevel: 'orientacao',
        reason: 'Para melhorar a precisão, envie também o formulário para a escola.',
        required: false,
      })
    }
  }

  if (
    context.differentialFlags.some((flag) => flag.includes('sono') || flag.includes('ronco'))
  ) {
    const destination = destinations.get('avaliacao_sono')
    if (destination && !referrals.some((item) => item.destination === 'avaliacao_sono')) {
      referrals.push({
        destination: 'avaliacao_sono',
        label: destination.label,
        priorityLevel: 'avaliacao_recomendada',
        reason: 'Sono pode influenciar desatenção e irritabilidade.',
        required: false,
      })
    }
  }

  return referrals
}

function resolveFollowup(classificationId: TdahTodClassificationId) {
  const plan = tdahTodContent.followupRules.followup_plan_by_classification.find(
    (item) => item.classification_id === classificationId,
  )
  return {
    days: plan?.default_next_check_days ?? null,
    message: plan?.actions?.join(' ') ?? undefined,
  }
}

export function runTdahTodEngine(
  answers: TdahTodAnswers,
  profile: TdahTodProfileInput,
): TdahTodEngineResult {
  const appliedRules: string[] = []
  const disclaimer =
    tdahTodContent.questions.metadata.diagnostic_disclaimer ??
    'O resultado não fecha diagnóstico. Ele identifica sinais compatíveis e orienta o melhor encaminhamento.'

  const ageGroup = resolveAgeGroup(profile.childAgeYears)
  appliedRules.push(`age_group:${ageGroup.id}`)

  if (ageGroup.eligibility === 'not_eligible' || ageGroup.eligibility === 'not_eligible_for_child_module') {
    return {
      moduleVersion: tdahTodContent.questions.metadata.version,
      disclaimer,
      childAgeYears: profile.childAgeYears,
      ageGroupId: ageGroup.id,
      ageGroupLabel: ageGroup.label,
      eligibility: ageGroup.eligibility,
      blocked: true,
      blockMessage: ageGroup.safe_message,
      informantTypeId: profile.informantTypeId,
      respondentId: profile.respondentId,
      availableRespondents: [profile.respondentId],
      confidence: 'baixa',
      classificationId: 'pendente',
      classificationLabel: 'Pendente',
      profileLabels: [],
      profilePhrases: [],
      domainScores: [],
      functionalImpairmentLevel: 'sem_prejuizo_relevante',
      functionalImpairmentLabel: 'Sem prejuízo funcional relevante',
      redFlags: [],
      urgentRedFlag: false,
      safeguardingRedFlag: false,
      differentialFlags: [],
      headline: 'Fora da faixa etária deste módulo',
      familySummary: ageGroup.safe_message,
      reassurance: 'Procure avaliação profissional adequada à idade.',
      nextSteps: [ageGroup.recommended_action ?? 'Procure avaliação profissional adequada à idade.'],
      referrals: resolveReferrals({
        classificationId: 'pendente',
        urgentRedFlag: false,
        safeguardingRedFlag: false,
        ageGroupId: ageGroup.id,
        differentialFlags: [],
        schoolFormRecommended: false,
      }),
      followupDays: null,
      schoolFormRecommended: false,
      safeResultPhrase: ageGroup.safe_message,
      appliedRules,
    }
  }

  const redFlagResult = scoreRedFlags(answers)
  appliedRules.push('red_flags_screened')

  if (redFlagResult.urgentRedFlag) {
    appliedRules.push('urgent_red_flag_override')
  }

  const homeDomains: TdahTodDomainScore[] = (
    ['desatencao', 'hiperatividade_impulsividade', 'oposicao_desafio'] as TdahTodDomainId[]
  ).map((domain) => scoreDomain(domain, 'responsavel', answers))

  const professorDomains = profile.professorAnswers
    ? (['desatencao', 'hiperatividade_impulsividade', 'oposicao_desafio'] as TdahTodDomainId[]).map(
        (domain) => scoreDomain(domain, 'professor', profile.professorAnswers!),
      )
    : []

  const domainScores = [...homeDomains, ...professorDomains]
  const insufficientDomain = domainScores.some((item) => item.scoreStatus === 'insuficiente')

  const relevantDomains = domainScores.filter((item) => item.flag === 'relevant_signal')
  const subclinicalDomains = domainScores.filter((item) => item.flag === 'subthreshold_signal')
  const relevantDomainCount = new Set(relevantDomains.map((item) => item.domain)).size
  const subclinicalDomainCount = new Set(subclinicalDomains.map((item) => item.domain)).size

  const desatencaoRelevant = relevantDomains.some((item) => item.domain === 'desatencao')
  const hyperRelevant = relevantDomains.some((item) => item.domain === 'hiperatividade_impulsividade')
  const oddRelevant = relevantDomains.some((item) => item.domain === 'oposicao_desafio')

  const functional = scoreFunctionalImpairment(profile.respondentId, answers)
  const differentialFlags = scoreDifferentials(answers)

  const availableRespondents: TdahTodRespondentId[] = profile.professorAnswers
    ? ['responsavel', 'professor']
    : ['responsavel']

  let confidence: TdahTodEngineResult['confidence'] = profile.professorAnswers ? 'maior' : 'moderada'
  if (insufficientDomain) confidence = 'baixa'

  let classificationId: TdahTodClassificationId = 'pendente'

  if (insufficientDomain) {
    classificationId = 'pendente'
    appliedRules.push('pendente_dados_insuficientes')
  } else if (redFlagResult.urgentRedFlag || redFlagResult.safeguardingRedFlag) {
    classificationId = 'prioridade_clinica'
    appliedRules.push('prioridade_por_red_flag')
  } else if (
    relevantDomainCount === 0 &&
    subclinicalDomainCount === 0 &&
    ['sem_prejuizo_relevante', 'prejuizo_leve'].includes(functional.levelId)
  ) {
    classificationId = 'baixo_indicativo'
    appliedRules.push('baixo_indicativo')
  } else if (
    relevantDomainCount === 0 &&
    subclinicalDomainCount >= 1 &&
    ['sem_prejuizo_relevante', 'prejuizo_leve'].includes(functional.levelId)
  ) {
    classificationId = 'sinais_leves'
    appliedRules.push('sinais_leves')
  } else if (
    relevantDomainCount >= 1 &&
    ['prejuizo_leve', 'prejuizo_moderado'].includes(functional.levelId)
  ) {
    classificationId = 'sinais_moderados'
    appliedRules.push('sinais_moderados')
  } else if (
    relevantDomainCount >= 2 &&
    ['prejuizo_moderado', 'prejuizo_importante'].includes(functional.levelId)
  ) {
    classificationId = 'sinais_importantes'
    appliedRules.push('sinais_importantes_multiplos_dominios')
  } else if (relevantDomainCount >= 1 && functional.levelId === 'prejuizo_importante') {
    classificationId = 'sinais_importantes'
    appliedRules.push('sinais_importantes_prejuizo')
  } else if (redFlagResult.anyRedFlag) {
    classificationId = 'sinais_importantes'
    appliedRules.push('sinais_importantes_red_flag')
  } else if (relevantDomainCount >= 1) {
    classificationId = 'sinais_moderados'
    appliedRules.push('sinais_moderados_fallback')
  } else {
    classificationId = 'sinais_leves'
    appliedRules.push('sinais_leves_fallback')
  }

  if (functional.levelId === 'sem_prejuizo_relevante' && !redFlagResult.urgentRedFlag) {
    classificationId = pickLower(classificationId, 'sinais_leves')
    appliedRules.push('cap_sem_prejuizo')
  }

  if (!profile.professorAnswers && !redFlagResult.urgentRedFlag && functional.levelId !== 'prejuizo_importante') {
    classificationId = pickLower(classificationId, 'sinais_moderados')
    appliedRules.push('cap_apenas_responsavel')
  }

  if (ageGroup.id === 'age_4_5_preschool' && functional.levelId !== 'prejuizo_importante' && !redFlagResult.urgentRedFlag) {
    classificationId = pickLower(classificationId, 'sinais_importantes')
    appliedRules.push('cap_pre_escolar')
  }

  if (relevantDomainCount >= 1 && functional.levelId === 'prejuizo_moderado') {
    classificationId = pickHigher(classificationId, 'sinais_moderados')
    appliedRules.push('floor_prejuizo_moderado')
  }
  if (relevantDomainCount >= 1 && functional.levelId === 'prejuizo_importante') {
    classificationId = pickHigher(classificationId, 'sinais_importantes')
    appliedRules.push('floor_prejuizo_importante')
  }

  const classificationMeta = tdahTodContent.cutoffs.classification_scale.find(
    (item) => item.id === classificationId,
  )
  const messageMeta = tdahTodContent.resultMessages.classification_messages.find(
    (item) => item.classification_id === classificationId,
  )

  if (!classificationMeta || !messageMeta) {
    throw new Error(`Classificação TDAH/TOD sem metadados: ${classificationId}`)
  }

  const profiles = resolveProfiles({ desatencaoRelevant, hyperRelevant, oddRelevant })
  const schoolFormRecommended = !profile.professorAnswers

  const informantNote = profile.professorAnswers
    ? 'O resultado considera informações de casa e escola, o que aumenta a confiança do rastreio.'
    : 'Este resultado representa principalmente o ambiente familiar. Para maior precisão, envie também o formulário para a escola.'

  const differentialNote =
    differentialFlags.length > 0
      ? 'Fatores como sono, ansiedade, humor, trauma, bullying, visão, audição, aprendizagem ou neurodesenvolvimento podem influenciar sinais parecidos com TDAH/TOD. Isso não anula o rastreio, mas pede investigação profissional.'
      : undefined

  const referrals = resolveReferrals({
    classificationId,
    urgentRedFlag: redFlagResult.urgentRedFlag,
    safeguardingRedFlag: redFlagResult.safeguardingRedFlag,
    ageGroupId: ageGroup.id,
    differentialFlags,
    schoolFormRecommended,
  })

  const followup = resolveFollowup(classificationId)

  const profilePhrase = profiles.map((item) => item.phrase).join(' ')
  const safeResultPhrase = [
    messageMeta.family_summary,
    profilePhrase,
    functional.levelId !== 'sem_prejuizo_relevante'
      ? `Há impacto relatado na rotina (${functional.label.toLowerCase()}).`
      : null,
    informantNote,
    differentialNote,
    disclaimer,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    moduleVersion: tdahTodContent.questions.metadata.version,
    disclaimer,
    childAgeYears: profile.childAgeYears,
    ageGroupId: ageGroup.id,
    ageGroupLabel: ageGroup.label,
    eligibility: ageGroup.eligibility,
    blocked: false,
    informantTypeId: profile.informantTypeId,
    respondentId: profile.respondentId,
    availableRespondents,
    confidence,
    classificationId,
    classificationLabel: classificationMeta.label,
    profileLabels: profiles.map((item) => item.label),
    profilePhrases: profiles.map((item) => item.phrase),
    domainScores,
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
    reassurance: messageMeta.reassurance,
    nextSteps: messageMeta.next_steps ?? [],
    referrals,
    followupDays: followup.days,
    followupMessage: followup.message,
    schoolFormRecommended,
    safeResultPhrase,
    appliedRules,
  }
}

import { engineContent } from './content/loadEngineContent'
import type { AnamnesisAnswerRecord } from '../types/mentalHealthEngine'

type Question = (typeof engineContent.anamnesisModules.questions)[number]

function applyPoints(
  scores: Record<string, number | boolean>,
  symptom: string,
  points: number,
) {
  const current = scores[symptom]
  if (typeof current === 'number') {
    scores[symptom] = Math.max(current, points)
    return
  }
  scores[symptom] = Math.max(typeof current === 'boolean' ? (current ? 1 : 0) : 0, points)
}

function scoreFromOptions(
  question: Question,
  answerValue: string | string[],
  scores: Record<string, number | boolean>,
) {
  const values = Array.isArray(answerValue) ? answerValue : [answerValue]
  for (const option of question.options ?? []) {
    if (!values.includes(option.value)) continue
    const contribution = option.score_contribution as
      | { symptom?: string; points?: number }
      | null
      | undefined
    if (contribution?.symptom && typeof contribution.points === 'number') {
      applyPoints(scores, contribution.symptom, contribution.points)
    }
    for (const token of option.maps_to ?? []) {
      if (typeof contribution?.points === 'number') {
        applyPoints(scores, token, contribution.points)
      }
    }
  }
}

function scoreFromScale(
  question: Question,
  answerValue: number,
  scores: Record<string, number | boolean>,
) {
  const rules = question.scoring?.rules as
    | Array<{ when_value_gte?: number; when_value_eq?: number; add_symptom_score?: { symptom: string; points: number } }>
    | undefined
  if (!rules?.length) return

  for (const rule of rules) {
    const meetsGte = rule.when_value_gte != null && answerValue >= rule.when_value_gte
    const meetsEq = rule.when_value_eq != null && answerValue === rule.when_value_eq
    if (!meetsGte && !meetsEq) continue
    const target = rule.add_symptom_score
    if (target?.symptom && typeof target.points === 'number') {
      applyPoints(scores, target.symptom, target.points)
    }
  }
}

function scoreFromDuration(
  question: Question,
  answerValue: number,
  scores: Record<string, number | boolean>,
  metrics: Record<string, number | boolean>,
) {
  const rules = question.scoring?.rules as
    | Array<{ when_duration_days_gte?: number; add_symptom_score?: { symptom: string; points: number } }>
    | undefined

  metrics.symptom_duration_days = Math.max(Number(metrics.symptom_duration_days ?? 0), answerValue)

  for (const rule of rules ?? []) {
    if (rule.when_duration_days_gte != null && answerValue >= rule.when_duration_days_gte) {
      const target = rule.add_symptom_score
      if (target?.symptom && typeof target.points === 'number') {
        applyPoints(scores, target.symptom, target.points)
      }
    }
  }
}

export function buildSymptomScoresFromAnamnesis(
  answersIndex: Record<string, AnamnesisAnswerRecord>,
): Record<string, number | boolean> {
  const scores: Record<string, number | boolean> = {}

  for (const question of engineContent.anamnesisModules.questions) {
    const answer = answersIndex[question.id]
    if (!answer || answer.skipped || answer.value == null) continue

    if (question.type === 'yes_no' || question.type === 'single' || question.type === 'multi') {
      scoreFromOptions(question, answer.value as string | string[], scores)
      continue
    }

    if (question.type === 'scale' && typeof answer.value === 'number') {
      scoreFromScale(question, answer.value, scores)
      continue
    }

    if (question.type === 'duration' && typeof answer.value === 'number') {
      scoreFromDuration(question, answer.value, scores, {})
    }
  }

  return scores
}

export function computeDerivedMetrics(
  symptomScores: Record<string, number | boolean>,
  answersIndex: Record<string, AnamnesisAnswerRecord>,
): Record<string, number | boolean> {
  const metrics: Record<string, number | boolean> = {}

  for (const metric of engineContent.symptomDictionary.derived_metrics) {
    const sources = metric.computed_from ?? []
    const values: number[] = []

    for (const sourceId of sources) {
      const answer = answersIndex[sourceId]
      if (answer?.value != null && typeof answer.value === 'number') {
        values.push(answer.value)
      }
      const symptomValue = symptomScores[sourceId]
      if (typeof symptomValue === 'number') values.push(symptomValue)
    }

    if (metric.value_type === 'boolean') {
      metrics[metric.id] = values.some((value) => value > 0)
      continue
    }

    if (metric.aggregation === 'max') {
      metrics[metric.id] = values.length ? Math.max(...values) : 0
      continue
    }

    if (metric.aggregation === 'avg') {
      metrics[metric.id] = values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0
      continue
    }

    metrics[metric.id] = values.length ? Math.max(...values) : 0
  }

  if (answersIndex.q_core_08?.value === 'yes') {
    metrics.change_from_baseline = true
  }

  const impairmentQuestions = ['q_func_01', 'q_func_02', 'q_func_03', 'q_func_04', 'q_func_05', 'q_func_06']
  const impairmentValues = impairmentQuestions
    .map((id) => answersIndex[id]?.value)
    .filter((value): value is number => typeof value === 'number')
  if (impairmentValues.length) {
    metrics.functional_impairment_global = Math.max(...impairmentValues)
  }

  return metrics
}

export function enrichSymptomScoresFromCheckIn(
  symptomScores: Record<string, number | boolean>,
  checkIn: {
    mood: string
    emotions: string[]
    emotionIntensity?: number | null
    mainInfluence?: string | null
    influenceValence?: string | null
    reactions?: string[]
  } | null,
) {
  if (!checkIn) return

  const moodMap: Record<string, number> = {
    'very-bad': 3,
    bad: 2,
    neutral: 1,
    good: 0,
    'very-good': 0,
  }
  const moodScore = moodMap[checkIn.mood] ?? 0
  if (moodScore > 0) {
    applyPoints(symptomScores, 'low_mood', moodScore)
    applyPoints(symptomScores, 'check_in_low_mood_today', moodScore)
  }

  if (checkIn.emotions.includes('Preocupado') || checkIn.emotions.includes('Frustrado')) {
    applyPoints(symptomScores, 'excessive_worry', 2)
    applyPoints(symptomScores, 'check_in_high_anxiety_today', 2)
  }

  if (checkIn.emotions.includes('Sobrecarregado')) {
    applyPoints(symptomScores, 'check_in_emotional_overload', 2)
  }

  if (checkIn.influenceValence === 'negative') {
    applyPoints(symptomScores, 'check_in_negative_influence_day', 1)
  }

  if (checkIn.reactions?.includes('Evitei a situação')) {
    applyPoints(symptomScores, 'check_in_avoidance_reaction', 1)
  }

  if (typeof checkIn.emotionIntensity === 'number') {
    applyPoints(symptomScores, 'symptom_intensity_level', checkIn.emotionIntensity)
  }
}

function getQuestionItemScore(questionId: string, answersIndex: Record<string, AnamnesisAnswerRecord>) {
  const question = engineContent.anamnesisModules.questions.find((item) => item.id === questionId)
  const answer = answersIndex[questionId]
  if (!question || !answer || answer.skipped || answer.value == null) return 0

  const tempScores: Record<string, number | boolean> = {}
  if (question.type === 'yes_no' || question.type === 'single' || question.type === 'multi') {
    scoreFromOptions(question, answer.value as string | string[], tempScores)
  } else if (question.type === 'scale' && typeof answer.value === 'number') {
    scoreFromScale(question, answer.value, tempScores)
  } else if (question.type === 'duration' && typeof answer.value === 'number') {
    scoreFromDuration(question, answer.value, tempScores, {})
  }

  return Object.values(tempScores).reduce<number>((max, value) => {
    if (typeof value === 'number') return Math.max(max, value)
    return max
  }, 0)
}

export function computeInstrumentScores(
  answersIndex: Record<string, AnamnesisAnswerRecord>,
) {
  const results: Record<
    string,
    {
      score: number
      max_score: number
      severity: string
      valid: boolean
      answered_ratio: number
      calculated_at: string
    }
  > = {}

  for (const instrument of engineContent.instruments.instruments) {
    const questionIds = instrument.questions ?? []
    const weights = (instrument.question_weights ?? {}) as unknown as Record<string, number>
    let answered = 0
    let score = 0

    for (const questionId of questionIds) {
      const answer = answersIndex[questionId]
      if (!answer || answer.skipped || answer.value == null) continue
      answered += 1
      const itemScore = getQuestionItemScore(questionId, answersIndex)
      const weight = typeof weights[questionId] === 'number' ? weights[questionId] : 1
      if (weight > 0) score += itemScore * weight
    }

    const answeredRatio = questionIds.length ? answered / questionIds.length : 0
    const minimumRatio = instrument.minimum_answered_ratio ?? 0.7
    const valid = answeredRatio >= minimumRatio
    const maxScore = instrument.scoring?.max_score ?? score
    let severity = 'minimal'

    for (const band of instrument.bands ?? []) {
      if (score >= band.min && score <= band.max) {
        severity = band.severity
        break
      }
    }

    results[instrument.id] = {
      score,
      max_score: maxScore,
      severity,
      valid,
      answered_ratio: answeredRatio,
      calculated_at: new Date().toISOString(),
    }
  }

  return results
}

export function computeAnamnesisCompletion(
  answersIndex: Record<string, AnamnesisAnswerRecord>,
) {
  const requiredModules = engineContent.anamnesisModules.modules.filter((module) => module.required)
  const completedModuleIds = requiredModules
    .filter((module) => {
      const moduleQuestions = engineContent.anamnesisModules.questions.filter(
        (question) => question.module_id === module.id && question.required,
      )
      if (!moduleQuestions.length) return false
      return moduleQuestions.every((question) => {
        const answer = answersIndex[question.id]
        return answer && !answer.skipped && answer.value != null
      })
    })
    .map((module) => module.id)

  const ratio = requiredModules.length
    ? completedModuleIds.length / requiredModules.length
    : 0

  return { completion_ratio: ratio, completed_module_ids: completedModuleIds }
}

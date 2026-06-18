type ConditionValue = Record<string, unknown>

function compareNumber(actual: number, expected: ConditionValue) {
  if (typeof expected.eq === 'number' && actual !== expected.eq) return false
  if (typeof expected.gte === 'number' && actual < expected.gte) return false
  if (typeof expected.lte === 'number' && actual > expected.lte) return false
  if (typeof expected.gt === 'number' && actual <= expected.gt) return false
  if (typeof expected.lt === 'number' && actual >= expected.lt) return false
  return true
}

function compareBoolean(actual: boolean, expected: ConditionValue) {
  if (typeof expected.eq === 'boolean' && actual !== expected.eq) return false
  return true
}

function getSymptomValue(ctx: Record<string, unknown>, id: string): number | boolean | undefined {
  const scores = ctx.symptom_scores as Record<string, number | boolean> | undefined
  const metrics = ctx.derived_metrics as Record<string, number | boolean> | undefined
  if (scores && id in scores) return scores[id]
  if (metrics && id in metrics) return metrics[id]
  return undefined
}

function evaluateAtomic(condition: ConditionValue, ctx: Record<string, unknown>): boolean {
  if ('all' in condition && Array.isArray(condition.all)) {
    return condition.all.every((item) => evaluateAtomic(item as ConditionValue, ctx))
  }
  if ('any' in condition && Array.isArray(condition.any)) {
    return condition.any.some((item) => evaluateAtomic(item as ConditionValue, ctx))
  }
  if ('not' in condition) {
    return !evaluateAtomic(condition.not as ConditionValue, ctx)
  }

  if ('always' in condition && condition.always === true) return true

  const copyContextKeys = [
    'mood',
    'emotions',
    'influences',
    'reactions',
    'latest_mood',
    'mood_score_delta',
    'history_days_count',
    'emotions_count',
    'emotion_intensity',
    'influence_valence',
    'main_influence',
  ] as const

  for (const key of copyContextKeys) {
    if (!(key in condition)) continue
    const expected = condition[key] as ConditionValue
    const actual = ctx[key]

    if (expected.present === true) return actual != null && actual !== ''
    if (expected.absent === true) return actual == null || actual === ''

    if (Array.isArray(expected.includes_any) && Array.isArray(actual)) {
      const includes = expected.includes_any as string[]
      return actual.some((item) => includes.includes(String(item)))
    }
    if (Array.isArray(expected.in) && typeof actual === 'string') {
      return expected.in.includes(actual)
    }
    if (typeof expected.eq === 'string' && typeof actual === 'string') {
      return actual === expected.eq
    }
    if (typeof actual === 'number') return compareNumber(actual, expected)
  }

  if ('symptom' in condition && typeof condition.symptom === 'string') {
    const value = getSymptomValue(ctx, condition.symptom)
    if (value === undefined) return false
    if (typeof value === 'boolean') return compareBoolean(value, condition)
    if (typeof value === 'number') return compareNumber(value, condition)
    return false
  }

  if ('metric' in condition && typeof condition.metric === 'string') {
    const metrics = ctx.derived_metrics as Record<string, number | boolean> | undefined
    const value = metrics?.[condition.metric]
    if (value === undefined) return false
    if (typeof value === 'boolean') return compareBoolean(value, condition)
    if (typeof value === 'number') return compareNumber(value, condition)
    return false
  }

  if ('instrument' in condition && typeof condition.instrument === 'string') {
    const instruments = ctx.instrument_scores as Record<string, { severity?: string; score?: number }>
    const record = instruments?.[condition.instrument]
    if (!record) return false
    if (Array.isArray(condition.severity_in)) {
      return condition.severity_in.includes(record.severity)
    }
    if (typeof condition.gte === 'number') {
      return (record.score ?? 0) >= condition.gte
    }
    return false
  }

  if ('instrument_score' in condition && typeof condition.instrument_score === 'object') {
    const spec = condition.instrument_score as { id?: string; gte?: number }
    if (!spec.id) return false
    const instruments = ctx.instrument_scores as Record<string, { score?: number }>
    const score = instruments?.[spec.id]?.score ?? 0
    if (typeof spec.gte === 'number') return score >= spec.gte
    return false
  }

  if ('track_score' in condition && typeof condition.track_score === 'object') {
    const spec = condition.track_score as Record<string, ConditionValue>
    const trackScores = ctx.track_scores_raw as Record<string, number> | undefined
    return Object.entries(spec).every(([track, rule]) => {
      const score = trackScores?.[track] ?? 0
      return compareNumber(score, rule)
    })
  }

  if ('track_tier' in condition && typeof condition.track_tier === 'object') {
    const spec = condition.track_tier as Record<string, ConditionValue>
    const tiers = ctx.track_tier as Record<string, string> | undefined
    return Object.entries(spec).every(([track, rule]) => {
      const tier = tiers?.[track]
      if (!tier) return false
      if (Array.isArray(rule.in)) return rule.in.includes(tier)
      if (typeof rule.eq === 'string') return tier === rule.eq
      return false
    })
  }

  if ('check_in' in condition && typeof condition.check_in === 'object') {
    const checkIn = condition.check_in as ConditionValue
    if (Array.isArray(checkIn.mood_in)) {
      const mood = ctx.today_mood as string | undefined
      if (!mood || !checkIn.mood_in.includes(mood)) return false
    }
    if (Array.isArray(checkIn.emotion_in)) {
      const emotions = ctx.today_emotions as string[] | undefined
      const emotionIn = checkIn.emotion_in as string[]
      if (!emotions?.some((item) => emotionIn.includes(item))) return false
    }
    if (typeof checkIn.days_in_last_7 === 'object' && checkIn.days_in_last_7) {
      const days = ctx.check_in_days_in_last_7 as Record<string, number> | undefined
      const moodIn = checkIn.mood_in as string[] | undefined
      const key = String(checkIn.symptom_signal ?? moodIn?.[0] ?? 'default')
      const count = days?.[key] ?? 0
      return compareNumber(count, checkIn.days_in_last_7 as ConditionValue)
    }
    return true
  }

  if ('history' in condition && typeof condition.history === 'object') {
    const history = ctx.history as Record<string, unknown> | undefined
    return Object.entries(condition.history as Record<string, ConditionValue>).every(([key, rule]) => {
      const value = history?.[key]
      if (key === 'helpful_activity_ids' && rule.count_gte != null) {
        const list = value as string[] | undefined
        return (list?.length ?? 0) >= Number(rule.count_gte)
      }
      if (key === 'helpful_activity_ids' && rule.includes_any) {
        const list = value as string[] | undefined
        const includes = rule.includes_any as string[]
        return list?.some((item) => includes.includes(item)) ?? false
      }
      if (typeof value === 'number') return compareNumber(value, rule)
      return false
    })
  }

  if ('profile' in condition && typeof condition.profile === 'object') {
    const profile = ctx.profile as Record<string, unknown> | undefined
    return Object.entries(condition.profile as Record<string, ConditionValue>).every(([key, rule]) => {
      const value = profile?.[key]
      if (Array.isArray(value) && Array.isArray(rule.includes_any)) {
        const includes = rule.includes_any as string[]
        return value.some((item) => includes.includes(String(item)))
      }
      if (Array.isArray(rule.in) && typeof value === 'string') {
        return rule.in.includes(value)
      }
      return false
    })
  }

  if ('active_red_flags' in condition) {
    const flags = ctx.active_red_flags as unknown[] | undefined
    if (condition.any === true) return (flags?.length ?? 0) > 0
    if (Array.isArray(condition.includes_any)) {
      const ids = (flags as Array<{ red_flag_id?: string }> | undefined)?.map((f) => f.red_flag_id) ?? []
      return condition.includes_any.some((id: string) => ids.includes(id))
    }
    return false
  }

  if ('no_active_red_flags' in condition) {
    const flags = ctx.active_red_flags as unknown[] | undefined
    const empty = (flags?.length ?? 0) === 0
    if (condition.eq === true) return empty
    return false
  }

  if ('data_completeness' in condition && typeof condition.data_completeness === 'object') {
    const completeness = ctx.data_completeness as Record<string, unknown> | undefined
    return Object.entries(condition.data_completeness as Record<string, ConditionValue>).every(
      ([key, rule]) => {
        const value = completeness?.[key]
        if (typeof value === 'boolean' && typeof rule.eq === 'boolean') return value === rule.eq
        if (typeof value === 'number') return compareNumber(value, rule)
        return false
      },
    )
  }

  const passthroughKeys = [
    'today_mood',
    'today_emotions',
    'today_emotion_intensity',
    'today_influences',
    'today_influence_valence',
    'today_reactions',
    'is_first_plan',
    'active_hypotheses_count',
    'selected_activities_count',
    'plan_blocked',
    'planner_status',
  ] as const

  for (const key of passthroughKeys) {
    if (!(key in condition)) continue
    const expected = condition[key] as ConditionValue
    const actual = ctx[key]
    if (Array.isArray(expected.in) && typeof actual === 'string') {
      return expected.in.includes(actual)
    }
    if (Array.isArray(expected.includes_any) && Array.isArray(actual)) {
      const includes = expected.includes_any as string[]
      return actual.some((item) => includes.includes(item as string))
    }
    if (typeof expected.eq === 'boolean' && typeof actual === 'boolean') {
      return actual === expected.eq
    }
    if (typeof expected.eq === 'number' && typeof actual === 'number') {
      return actual === expected.eq
    }
    if (typeof expected.gte === 'number' && typeof actual === 'number') {
      return actual >= expected.gte
    }
    if (typeof expected.lt === 'number' && typeof actual === 'number') {
      return actual < expected.lt
    }
  }

  if ('primary_track' in condition && typeof condition.primary_track === 'object') {
    const primary = ctx.primary_track_id as string | null | undefined
    const spec = condition.primary_track as ConditionValue
    if (typeof spec.eq === 'string') return primary === spec.eq
    return false
  }

  if ('evidence_tag' in condition && typeof condition.evidence_tag === 'string') {
    const tags = ctx.evidence_tags as string[] | undefined
    return tags?.includes(condition.evidence_tag) ?? false
  }

  if ('anamnesis_answer' in condition && typeof condition.anamnesis_answer === 'object') {
    const spec = condition.anamnesis_answer as { question_id?: string; answer_in?: string[] }
    const answers = ctx.anamnesis_answers as Record<string, { value?: unknown }> | undefined
    const answer = answers?.[spec.question_id ?? '']?.value
    if (Array.isArray(spec.answer_in)) {
      return spec.answer_in.includes(String(answer))
    }
    return false
  }

  if ('default' in condition && condition.default === true) return true

  return false
}

export function evaluateConditions(
  when: ConditionValue | undefined,
  ctx: Record<string, unknown>,
): boolean {
  if (!when || Object.keys(when).length === 0) return true
  return evaluateAtomic(when, ctx)
}

export function evaluateUnless(
  unless: ConditionValue[] | undefined,
  ctx: Record<string, unknown>,
): boolean {
  if (!unless?.length) return false
  return unless.some((item) => evaluateConditions(item, ctx))
}

import { engineContent } from './content/loadEngineContent'
import { evaluateConditions } from './evaluateConditions'
import { buildDailyMomentProgram } from './buildDailyMomentProgram'
import type { MentalHealthMoodLevelId } from '../types/mentalHealth'
import { isCrisisCheckInMood } from '../types/mentalHealth'
import type { ActiveRedFlag } from '../types/mentalHealthEngine'

export type SelectedActivityCandidate = {
  activity_id: string
  slot: 'now' | 'daytime' | 'evening'
  matched_rule_id: string
  pool_id: string | null
  why_internal: string | null
  why_user_moment: string | null
  priority: number
}

function stableHash(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function isActivityBlocked(
  activityId: string,
  activeRedFlags: ActiveRedFlag[],
  notHelpfulIds: string[],
) {
  if (notHelpfulIds.includes(activityId)) return true

  const activity = engineContent.activityCatalog.activities.find((item) => item.id === activityId)
  if (!activity) return true

  const activeIds = activeRedFlags.map((flag) => flag.red_flag_id)
  return (activity.avoid_when_red_flags ?? []).some((flagId) => activeIds.includes(flagId))
}

function pickFromPool(
  poolId: string,
  ctx: Record<string, unknown>,
  excludeIds: Set<string>,
  activeRedFlags: ActiveRedFlag[],
  notHelpfulIds: string[],
  seed: string,
) {
  const pools = engineContent.activitySelectionRules.activity_pools as Record<
    string,
    {
      activity_ids?: string[]
      runtime_source?: string
      enabled?: boolean
    }
  >
  const pool = pools[poolId]
  if (!pool) return null

  let candidates = [...(pool.activity_ids ?? [])]

  const runtimeSource = pool.runtime_source as string | undefined
  if (runtimeSource === 'history.helpful_activity_ids') {
    const history = ctx.history as { helpful_activity_ids?: string[] } | undefined
    candidates = history?.helpful_activity_ids ?? []
  }

  candidates = candidates.filter((activityId) => {
    if (excludeIds.has(activityId)) return false
    if (isActivityBlocked(activityId, activeRedFlags, notHelpfulIds)) return false

    const activity = engineContent.activityCatalog.activities.find((item) => item.id === activityId)
    if (!activity) return false
    if (activity.intensity !== 'low') return false
    return true
  })

  if (!candidates.length) {
    const fallbackPool = poolId === 'fallback_safe_low' ? 'universal_low_intensity' : 'fallback_safe_low'
    if (fallbackPool !== poolId) {
      return pickFromPool(fallbackPool, ctx, excludeIds, activeRedFlags, notHelpfulIds, seed)
    }
    return null
  }

  const helpfulIds = (ctx.history as { helpful_activity_ids?: string[] } | undefined)
    ?.helpful_activity_ids
  const helpfulMatch = candidates.find((id) => helpfulIds?.includes(id))
  if (helpfulMatch) return helpfulMatch

  const idx = stableHash(seed) % candidates.length
  return candidates[idx] ?? candidates[0]
}

function shouldBlockSelection(ctx: Record<string, unknown>, activeRedFlags: ActiveRedFlag[]) {
  const todayMood = ctx.today_mood as MentalHealthMoodLevelId | undefined
  if (todayMood && !isCrisisCheckInMood(todayMood)) {
    return false
  }

  const blockedRule = engineContent.activitySelectionRules.rules.find(
    (rule) =>
      rule.id.startsWith('block_red_flag') &&
      evaluateConditions(rule.when as Record<string, unknown>, ctx),
  )

  if (blockedRule) return true

  const blockOnFlags =
    engineContent.activitySelectionRules.global_settings.block_on_active_red_flags === true
  return blockOnFlags && activeRedFlags.length > 0 && shouldBlockFromGlobal(activeRedFlags)
}

export function selectDailyActivities(ctx: Record<string, unknown>, activeRedFlags: ActiveRedFlag[]) {
  if (shouldBlockSelection(ctx, activeRedFlags)) {
    return {
      blocked: true as const,
      activities: [] as SelectedActivityCandidate[],
      rulesFired: ['block_red_flag'],
    }
  }

  const history = ctx.history as {
    completed_activity_ids?: string[]
    not_helpful_activity_ids?: string[]
    helpful_activity_ids?: string[]
  } | undefined
  const excludeIds = new Set(history?.completed_activity_ids ?? [])
  const notHelpfulIds = history?.not_helpful_activity_ids ?? []
  const profile = ctx.profile as { careFocus?: string[] } | undefined

  const maxActivities = engineContent.activitySelectionRules.global_settings.max_activities_per_day ?? 4
  const localDate = String(ctx.local_date ?? 'today')

  const program = buildDailyMomentProgram({
    mood: ctx.today_mood as MentalHealthMoodLevelId | undefined,
    emotions: (ctx.today_emotions as string[] | undefined) ?? [],
    emotionIntensity: ctx.today_emotion_intensity as number | null | undefined,
    influences: (ctx.today_influences as string[] | undefined) ?? [],
    influenceValence: ctx.today_influence_valence as string | null | undefined,
    reactions: (ctx.today_reactions as string[] | undefined) ?? [],
    careFocus: profile?.careFocus ?? [],
    primaryTrackId: (ctx.primary_track_id as string | null | undefined) ?? null,
    hasTodayCheckIn: ctx.has_today_check_in === true,
    maxActivities,
  })

  const selected: SelectedActivityCandidate[] = []
  const rulesFired: string[] = []
  const usedPools = new Set<string>()

  for (const [index, step] of program.entries()) {
    if (selected.length >= maxActivities) break
    if (usedPools.has(step.pool)) continue

    const activityId = pickFromPool(
      step.pool,
      ctx,
      excludeIds,
      activeRedFlags,
      notHelpfulIds,
      `${localDate}-${step.ruleId}-${index}`,
    )
    if (!activityId) continue

    excludeIds.add(activityId)
    usedPools.add(step.pool)
    rulesFired.push(step.ruleId)
    selected.push({
      activity_id: activityId,
      slot: step.slot,
      matched_rule_id: step.ruleId,
      pool_id: step.pool,
      why_internal: step.ruleId,
      why_user_moment: step.why,
      priority: maxActivities - index,
    })
  }

  if (!selected.length) {
    const fallbackActivity = pickFromPool(
      'fallback_safe_low',
      ctx,
      excludeIds,
      activeRedFlags,
      notHelpfulIds,
      `${localDate}-fallback`,
    )
    if (fallbackActivity) {
      selected.push({
        activity_id: fallbackActivity,
        slot: 'now',
        matched_rule_id: 'fallback_default',
        pool_id: 'fallback_safe_low',
        why_internal: 'fallback_default',
        why_user_moment: 'Escolhemos algo leve para o seu momento de hoje.',
        priority: 0,
      })
      rulesFired.push('fallback_default')
    }
  }

  if (!selected.length) {
    const activeIds = activeRedFlags.map((flag) => flag.red_flag_id)
    const emergency = engineContent.activityCatalog.activities.find((activity) => {
      if (activity.enabled === false || activity.intensity !== 'low') return false
      if (notHelpfulIds.includes(activity.id)) return false
      return !(activity.avoid_when_red_flags ?? []).some((flagId) => activeIds.includes(flagId))
    })

    if (emergency) {
      selected.push({
        activity_id: emergency.id,
        slot: 'now',
        matched_rule_id: 'fallback_emergency_any',
        pool_id: null,
        why_internal: 'fallback_emergency_any',
        why_user_moment: 'Escolhemos algo leve para o seu momento de hoje.',
        priority: 0,
      })
      rulesFired.push('fallback_emergency_any')
    }
  }

  return { blocked: false as const, activities: selected, rulesFired }
}

function shouldBlockFromGlobal(activeRedFlags: ActiveRedFlag[]) {
  return activeRedFlags.some((flag) => {
    const definition = engineContent.redFlags.red_flags?.find((item) => item.id === flag.red_flag_id)
    return definition?.actions?.block_micro_activity_plan === true
  })
}

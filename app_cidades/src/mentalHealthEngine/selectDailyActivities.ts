import { engineContent } from './content/loadEngineContent'
import { evaluateConditions } from './evaluateConditions'
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
  pick: Record<string, unknown>,
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

  const intensityFilter = pick.intensity_in as string[] | undefined
  const maxDuration = pick.max_duration_min as number | undefined

  candidates = candidates.filter((activityId) => {
    if (excludeIds.has(activityId)) return false
    if (isActivityBlocked(activityId, activeRedFlags, notHelpfulIds)) return false

    const activity = engineContent.activityCatalog.activities.find((item) => item.id === activityId)
    if (!activity) return false
    if (intensityFilter?.length && !intensityFilter.includes(activity.intensity)) return false
    if (maxDuration != null && activity.duration_min > maxDuration) return false
    return true
  })

  if (!candidates.length && typeof pick.fallback_pool === 'string') {
    return pickFromPool(
      pick.fallback_pool,
      ctx,
      excludeIds,
      activeRedFlags,
      notHelpfulIds,
      { ...pick, fallback_pool: undefined },
    )
  }

  return candidates[0] ?? null
}

export function selectDailyActivities(ctx: Record<string, unknown>, activeRedFlags: ActiveRedFlag[]) {
  const blockedRule = engineContent.activitySelectionRules.rules.find(
    (rule) => rule.id.startsWith('block_red_flag') && evaluateConditions(rule.when as Record<string, unknown>, ctx),
  )
  if (blockedRule || (engineContent.activitySelectionRules.global_settings.block_on_active_red_flags && activeRedFlags.length && shouldBlockFromGlobal(activeRedFlags))) {
    return { blocked: true as const, activities: [] as SelectedActivityCandidate[], rulesFired: [blockedRule?.id ?? 'block_red_flag'] }
  }

  const history = ctx.history as {
    completed_activity_ids?: string[]
    not_helpful_activity_ids?: string[]
  } | undefined
  const excludeIds = new Set(history?.completed_activity_ids ?? [])
  const notHelpfulIds = history?.not_helpful_activity_ids ?? []

  const sortedRules = [...engineContent.activitySelectionRules.rules]
    .filter((rule) => rule.enabled !== false && !rule.id.startsWith('block_') && !rule.id.startsWith('fallback_'))
    .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))

  const selected: SelectedActivityCandidate[] = []
  const usedSlots = new Set<string>()
  const rulesFired: string[] = []
  const maxActivities = engineContent.activitySelectionRules.global_settings.max_activities_per_day ?? 3

  for (const rule of sortedRules) {
    if (selected.length >= maxActivities) break
    if (!evaluateConditions(rule.when as Record<string, unknown>, ctx)) continue

    const pick = rule.pick as Record<string, unknown> | undefined
    if (!pick || pick.count === 0) continue

    const slot = (rule.assign_slot ?? 'now') as 'now' | 'daytime' | 'evening'
    if (usedSlots.has(slot) && selected.some((item) => item.slot === slot)) continue

    let activityId: string | null = null
    let poolId: string | null = null

    const explicitIds = pick.activity_ids_explicit as string[] | undefined
    if (explicitIds?.length) {
      activityId = explicitIds.find((id) => !excludeIds.has(id)) ?? null
    } else if (typeof pick.from_pool === 'string') {
      poolId = pick.from_pool
      activityId = pickFromPool(poolId, ctx, excludeIds, activeRedFlags, notHelpfulIds, pick)
    }

    if (!activityId) continue

    excludeIds.add(activityId)
    usedSlots.add(slot)
    rulesFired.push(rule.id)
    selected.push({
      activity_id: activityId,
      slot,
      matched_rule_id: rule.id,
      pool_id: poolId,
      why_internal: rule.why_internal ?? null,
      why_user_moment: rule.why_user_moment ?? null,
      priority: rule.priority ?? 0,
    })
  }

  if (!selected.length) {
    const fallbackPool = engineContent.activitySelectionRules.fallback_chain?.[0]?.pool ?? 'fallback_safe_low'
    const fallbackActivity = pickFromPool(
      fallbackPool,
      ctx,
      excludeIds,
      activeRedFlags,
      notHelpfulIds,
      { intensity_in: ['low'] },
    )
    if (fallbackActivity) {
      selected.push({
        activity_id: fallbackActivity,
        slot: 'now',
        matched_rule_id: 'fallback_default',
        pool_id: fallbackPool,
        why_internal: 'fallback_default',
        why_user_moment: 'Escolhemos algo leve para o seu momento de hoje.',
        priority: 0,
      })
      rulesFired.push('fallback_default')
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

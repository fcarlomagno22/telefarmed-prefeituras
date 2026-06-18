import { engineContent } from './content/loadEngineContent'
import { evaluateConditions } from './evaluateConditions'
import type { ActiveRedFlag } from '../types/mentalHealthEngine'

export function runRedFlagEngine(ctx: Record<string, unknown>, existing: ActiveRedFlag[] = []) {
  const triggered = new Map(existing.map((flag) => [flag.red_flag_id, flag]))
  const now = new Date().toISOString()

  const sortedTriggers = [...(engineContent.redFlags.trigger_rules ?? [])].sort(
    (left, right) => (right.priority ?? 0) - (left.priority ?? 0),
  )

  for (const trigger of sortedTriggers) {
    if (!evaluateConditions(trigger.when as Record<string, unknown>, ctx)) continue

    const definition = engineContent.redFlags.red_flags?.find(
      (flag) => flag.id === trigger.red_flag_id,
    )
    if (!definition) continue

    triggered.set(trigger.red_flag_id, {
      red_flag_id: trigger.red_flag_id,
      severity: definition.severity,
      triggered_at: now,
      trigger_rule_id: trigger.id,
      status: 'open',
      resolved_at: null,
    })
  }

  return [...triggered.values()]
}

export function shouldBlockMicroPlan(activeRedFlags: ActiveRedFlag[]) {
  if (!activeRedFlags.length) return false

  return activeRedFlags.some((flag) => {
    const definition = engineContent.redFlags.red_flags?.find(
      (item) => item.id === flag.red_flag_id,
    )
    return definition?.actions?.block_micro_activity_plan === true
  })
}

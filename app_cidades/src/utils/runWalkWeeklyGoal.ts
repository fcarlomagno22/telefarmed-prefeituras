import type { WeeklyGoalStats, WeeklyGoalTargets } from '../types/runWalk'

export function hasWeeklyGoal(stats: WeeklyGoalStats) {
  return (
    stats.targetActivities > 0 &&
    stats.targetActiveMinutes > 0 &&
    stats.targetMovementDays > 0
  )
}

export function applyWeeklyGoalTargets(
  stats: WeeklyGoalStats,
  targets: WeeklyGoalTargets | null,
): WeeklyGoalStats {
  if (!targets) {
    return {
      ...stats,
      targetActivities: 0,
      targetActiveMinutes: 0,
      targetMovementDays: 0,
    }
  }

  return {
    ...stats,
    targetActivities: targets.targetActivities,
    targetActiveMinutes: targets.targetActiveMinutes,
    targetMovementDays: targets.targetMovementDays,
  }
}

export const WEEKLY_GOAL_PRESETS: Array<{
  id: string
  label: string
  subtitle: string
  targets: WeeklyGoalTargets
}> = [
  {
    id: 'light',
    label: 'Leve',
    subtitle: 'Começo suave',
    targets: { targetActivities: 2, targetActiveMinutes: 60, targetMovementDays: 3 },
  },
  {
    id: 'regular',
    label: 'Regular',
    subtitle: 'Boa rotina',
    targets: { targetActivities: 4, targetActiveMinutes: 150, targetMovementDays: 5 },
  },
  {
    id: 'ambitious',
    label: 'Ambiciosa',
    subtitle: 'Semana forte',
    targets: { targetActivities: 5, targetActiveMinutes: 210, targetMovementDays: 6 },
  },
]

export const WEEKLY_GOAL_LIMITS = {
  activities: { min: 1, max: 7 },
  minutes: { min: 30, max: 300, step: 10 },
  movementDays: { min: 1, max: 7 },
} as const

export const DEFAULT_WEEKLY_GOAL_DRAFT: WeeklyGoalTargets = {
  targetActivities: 4,
  targetActiveMinutes: 150,
  targetMovementDays: 5,
}

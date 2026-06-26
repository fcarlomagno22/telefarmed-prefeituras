export type PendingWeeklyGoalCelebration = {
  dateIso: string
  fromMinutes: number
  toMinutes: number
}

let pendingCelebration: PendingWeeklyGoalCelebration | null = null

export function setPendingWeeklyGoalCelebration(celebration: PendingWeeklyGoalCelebration) {
  pendingCelebration = celebration
}

export function consumePendingWeeklyGoalCelebration(): PendingWeeklyGoalCelebration | null {
  const celebration = pendingCelebration
  pendingCelebration = null
  return celebration
}

export function peekPendingWeeklyGoalCelebration(): PendingWeeklyGoalCelebration | null {
  return pendingCelebration
}

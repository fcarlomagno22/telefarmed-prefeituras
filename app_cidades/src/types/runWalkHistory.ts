import type { RunWalkActivitySummary } from '../data/runWalkActivitySummaryStorage'

export type RunWalkHistoryPeriod = '7d' | '30d' | '90d' | 'all' | 'custom'

export type RunWalkHistoryDateRange = {
  startIso: string
  endIso: string
}

export type RunWalkHistorySort = 'recent' | 'distance' | 'duration'

export type RunWalkHistoryChartMetric = 'minutes' | 'distance'

export type RunWalkHistoryAdvancedFilters = {
  minDistanceKm: number
}

export type RunWalkHistoryPeriodSummary = {
  totalDistanceKm: number
  totalActiveMinutes: number
  totalWorkouts: number
  totalCalories: number
  distanceDeltaPct: number | null
  minutesDeltaPct: number | null
  workoutsDeltaPct: number | null
  caloriesDeltaPct: number | null
}

export type RunWalkHistoryHighlight = {
  id: string
  title: string
  value: string
  subtitle: string
  accent: string
  activityId?: string
}

export type RunWalkHistoryTrendPoint = {
  id: string
  label: string
  value: number
  dateIso: string
  activityName: string
}

export type RunWalkHistoryHeatmapCell = {
  dateIso: string
  day: number
  intensity: number
  activeMinutes: number
  distanceKm: number
  hasActivity: boolean
}

export type RunWalkHistoryMonthGroup = {
  key: string
  label: string
  activities: RunWalkActivitySummary[]
}

export type RunWalkHistoryKmSplit = {
  km: number
  elapsedSeconds: number
  paceMinPerKm: number | null
}

export type RunWalkHistoryPacePoint = {
  distanceKm: number
  paceMinPerKm: number | null
  elapsedSeconds: number
}

export type RunWalkHistoryModalityComparison = {
  previousActivityId: string
  previousDateLabel: string
  paceDeltaSeconds: number | null
  distanceDeltaKm: number | null
}

export const DEFAULT_RUN_WALK_HISTORY_FILTERS: RunWalkHistoryAdvancedFilters = {
  minDistanceKm: 0,
}

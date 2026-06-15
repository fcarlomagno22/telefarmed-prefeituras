export type HydrationDayRecord = {
  id: string
  date: string
  totalMl: number
}

export type HydrationTrendDirection = 'up' | 'down' | 'stable'

export type HydrationTrendBucket = {
  label: string
  avg: number
  count: number
}

export type HydrationDayHighlight = {
  date: string
  totalMl: number
  belowGoal: boolean
}

export type HydrationReportSummary = {
  periodLabel: string
  periodStart: Date
  periodEnd: Date
  goalMl: number
  goalL: number
  totalMl: number
  totalL: number
  dailyAverageMl: number
  dailyAverageL: number
  daysTracked: number
  daysBelowGoal: number
  daysAtOrAboveGoal: number
  belowGoalPct: number
  atOrAboveGoalPct: number
  bestDay: HydrationDayHighlight | null
  worstDay: HydrationDayHighlight | null
  trend: {
    direction: HydrationTrendDirection
    changePct: number
    buckets: HydrationTrendBucket[]
  }
  belowGoalDays: HydrationDayRecord[]
  days: HydrationDayRecord[]
}

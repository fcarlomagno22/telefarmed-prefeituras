export type StepsPeriod = 'today' | 'week' | 'month'

export type StepsSource =
  | 'Apple Health'
  | 'Health Connect'
  | 'Galaxy Watch'
  | 'Mi Band'
  | 'Manual'

export type StepsDayRecord = {
  id: string
  date: Date
  steps: number
  source: StepsSource
  peakHourStart?: number
  peakHourEnd?: number
}

export type StepsGoalStatusLabel = 'Abaixo da meta' | 'Na meta' | 'Meta batida'

export type StepsPeriodSummary = {
  min: number
  avg: number
  max: number
  total: number
  daysHitGoal: number
  daysInPeriod: number
  count: number
}

export type ManualWalkEntry = {
  durationMinutes: number
  steps: number
}

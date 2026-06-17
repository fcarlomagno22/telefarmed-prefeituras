import type { SleepLogEntry, SleepQualityScore } from './sleepLog'

export type SleepCalendarDay = {
  dateIso: string
  weekdayLabel: string
  dayNumber: number
  monthKey: string
  monthLabel: string
  isToday: boolean
  isFuture: boolean
  hasData?: boolean
}

export type SleepDayStat = {
  dateIso: string
  weekdayLabel: string
  dayNumber: number
  isToday: boolean
  isFuture: boolean
  hasData: boolean
  durationMinutes: number
  quality: SleepQualityScore | null
  wakeCount: number
  entry: SleepLogEntry | null
}

export type SleepQualityDistribution = {
  excellent: number
  good: number
  fair: number
  poor: number
}

export type SleepHighlight = {
  id: string
  title: string
  subtitle: string
  value: string
  dateIso: string
  accentColor: string
}

export type SleepWeekSummary = {
  weekLabel: string
  nightsLogged: number
  avgDurationMinutes: number
  avgQuality: number
  totalWakeCount: number
  durationDeltaPct: number | null
  qualityDeltaPct: number | null
  dayStats: SleepDayStat[]
  qualityDistribution: SleepQualityDistribution
  highlights: SleepHighlight[]
}

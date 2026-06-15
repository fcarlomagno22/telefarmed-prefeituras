export type GlucoseReadingContext = 'fasting' | 'pre_meal' | 'post_meal' | 'bedtime' | 'other'

export type GlucoseReading = {
  amountMg: number
  context: GlucoseReadingContext
}

export type GlucoseHistoryEntry = {
  id: string
  recordedAt: string
  amountMg: number
  context: GlucoseReadingContext
}

export type GlucoseContextStats = {
  count: number
  avg: number
  inTargetPct: number
  outOfTargetPct: number
}

export type GlucoseTrendBucket = {
  label: string
  avg: number
  count: number
}

export type GlucoseTrendDirection = 'up' | 'down' | 'stable'

export type GlucoseReportSummary = {
  periodLabel: string
  periodStart: Date
  periodEnd: Date
  totalReadings: number
  overall: {
    min: number
    max: number
    avg: number
    inTargetPct: number
    outOfTargetPct: number
  }
  fasting: GlucoseContextStats | null
  postMeal: GlucoseContextStats | null
  preMeal: GlucoseContextStats | null
  hypoglycemia: {
    count: number
    readings: GlucoseHistoryEntry[]
  }
  hyperglycemia: {
    count: number
    readings: GlucoseHistoryEntry[]
  }
  trend: {
    buckets: GlucoseTrendBucket[]
    direction: GlucoseTrendDirection
    changePct: number
  }
  readings: GlucoseHistoryEntry[]
}

export type HeartRateContext = 'resting' | 'workout' | 'sleep' | 'manual'

export type HeartRateSource =
  | 'Apple Health'
  | 'Health Connect'
  | 'Galaxy Watch'
  | 'Mi Band'
  | 'Manual'

export type HeartRateReading = {
  id: string
  bpm: number
  recordedAt: Date
  source: HeartRateSource
  context: HeartRateContext
}

export type HeartRateZoneLabel = 'Repouso' | 'Normal' | 'Elevado' | 'Alta'

export type HeartRateSummary = {
  min: number
  avg: number
  max: number
  count: number
}

export type HeartRateTrendDirection = 'up' | 'down' | 'stable'

export type HeartRateTrendBucket = {
  label: string
  avgBpm: number
  avgRestingBpm: number
  count: number
}

export type HeartRateEffortInsight = {
  available: boolean
  activeDayCount: number
  avgWorkoutBpm: number
  avgRestingBpm: number
  avgStepsOnActiveDays: number
  avgDistanceKmOnActiveDays: number
  summary: string
}

export type HeartRateReportSummary = {
  periodLabel: string
  periodStart: Date
  periodEnd: Date
  totalReadings: number
  overall: HeartRateSummary
  resting: HeartRateSummary
  restingAvg: number
  workout: HeartRateSummary
  peaksAboveNormal: {
    count: number
    pct: number
    threshold: number
    readings: HeartRateReading[]
  }
  highPeaks: {
    count: number
    readings: HeartRateReading[]
  }
  bradycardia: {
    count: number
    readings: HeartRateReading[]
  }
  effort: HeartRateEffortInsight
  trend: {
    buckets: HeartRateTrendBucket[]
    direction: HeartRateTrendDirection
    changePct: number
  }
  readings: HeartRateReading[]
}

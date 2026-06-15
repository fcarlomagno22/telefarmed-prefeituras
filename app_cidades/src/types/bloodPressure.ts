export type BloodPressureReading = {
  systolic: number
  diastolic: number
}

export type BloodPressureHistoryEntry = BloodPressureReading & {
  id: string
  recordedAt: string
}

export type BloodPressureTarget = {
  systolic: number
  diastolic: number
}

export type BloodPressureZoneLabel = 'Normal' | 'Elevada' | 'Alta'

export type BloodPressureTimeSlot = 'morning' | 'afternoon' | 'evening' | 'night'

export type BloodPressureTimeSlotStats = {
  slot: BloodPressureTimeSlot
  label: string
  count: number
  avgSystolic: number
  avgDiastolic: number
  aboveTargetPct: number
}

export type BloodPressureTrendBucket = {
  label: string
  avgSystolic: number
  avgDiastolic: number
  count: number
}

export type BloodPressureTrendDirection = 'up' | 'down' | 'stable'

export type BloodPressureHypertensionPattern = {
  sustainedDayCount: number
  isolatedPeakCount: number
  sustainedReadings: BloodPressureHistoryEntry[]
  isolatedPeakReadings: BloodPressureHistoryEntry[]
}

export type BloodPressureReportSummary = {
  periodLabel: string
  periodStart: Date
  periodEnd: Date
  target: BloodPressureTarget
  totalReadings: number
  overall: {
    minSystolic: number
    maxSystolic: number
    minDiastolic: number
    maxDiastolic: number
    avgSystolic: number
    avgDiastolic: number
    inTargetPct: number
    outOfTargetPct: number
  }
  aboveTarget: {
    count: number
    pct: number
    readings: BloodPressureHistoryEntry[]
  }
  hypertensionPattern: BloodPressureHypertensionPattern
  timeSlots: BloodPressureTimeSlotStats[]
  peakTimeSlot: BloodPressureTimeSlotStats | null
  trend: {
    buckets: BloodPressureTrendBucket[]
    direction: BloodPressureTrendDirection
    systolicChangePct: number
  }
  readings: BloodPressureHistoryEntry[]
}

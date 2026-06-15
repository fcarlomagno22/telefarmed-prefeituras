export type ImcZoneSummary = {
  label: string
  rangeLabel: string
  color: string
}

export type CompositionTrendBucket = {
  label: string
  avg: number
  count: number
}

export type CompositionTrendDirection = 'up' | 'down' | 'stable'

export type CompositionTrendSummary = {
  buckets: CompositionTrendBucket[]
  direction: CompositionTrendDirection
  changePct: number
}

export type WeightReading = {
  date: string
  valueKg: number
}

export type ImcReading = {
  date: string
  value: number
  zoneLabel: string
  zoneColor: string
}

export type AbdomenReading = {
  date: string
  valueCm: number
  zoneLabel: string
  zoneColor: string
  zoneHint: string
}

export type BodyCompositionReportSummary = {
  periodLabel: string
  periodStart: Date
  periodEnd: Date
  profile: {
    height: string
    weight: string
    gender: string
  }
  imc: {
    current: number | null
    zone: ImcZoneSummary | null
    trend: CompositionTrendSummary & { changeAbs: number }
    readings: ImcReading[]
  }
  weight: {
    min: number
    max: number
    avg: number
    startKg: number | null
    endKg: number | null
    deltaKg: number | null
    deltaLabel: string
    trend: CompositionTrendSummary
    readings: WeightReading[]
  }
  abdomen: {
    min: number
    max: number
    avg: number
    idealMaxCm: number
    highRiskFromCm: number
    aboveIdealPct: number
    elevatedRiskCount: number
    trend: CompositionTrendSummary
    readings: AbdomenReading[]
  }
  totalDataPoints: number
}

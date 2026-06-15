import { BodyMeasurementGroup, BodyMeasurementId, StorableBodyMeasurementId } from './bodyMeasurements'

export type BodyMeasurementTrendDirection = 'up' | 'down' | 'stable'

export type BodyMeasurementTrendBucket = {
  label: string
  avg: number
  count: number
}

export type BodyMeasurementTrendSummary = {
  buckets: BodyMeasurementTrendBucket[]
  direction: BodyMeasurementTrendDirection
  changePct: number
}

export type BodyMeasurementReadingPoint = {
  date: string
  value: number
}

export type BodyMeasurementSeriesReport = {
  id: BodyMeasurementId
  label: string
  shortLabel: string
  unit: string
  group: BodyMeasurementGroup
  count: number
  start: number | null
  end: number | null
  min: number
  max: number
  avg: number
  delta: number | null
  deltaLabel: string
  trend: BodyMeasurementTrendSummary
  readings: BodyMeasurementReadingPoint[]
}

export type BodyMeasurementsReportSummary = {
  periodLabel: string
  periodStart: Date
  periodEnd: Date
  totalReadings: number
  trackedMeasurementCount: number
  principal: BodyMeasurementSeriesReport[]
  complementar: BodyMeasurementSeriesReport[]
  waistHipRatio: BodyMeasurementSeriesReport | null
  highlights: string[]
  mostChanged: BodyMeasurementSeriesReport | null
  allSeries: BodyMeasurementSeriesReport[]
}

export const BODY_MEASUREMENTS_REPORT_IDS: StorableBodyMeasurementId[] = [
  'abdomen',
  'quadril',
  'peito',
  'cintura',
  'coxa',
  'braco',
  'pescoco',
]

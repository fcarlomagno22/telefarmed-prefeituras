import type { AtividadeDayRecordDto } from '../lib/api/vd/metricas'
import { ManualWalkEntry, StepsDayRecord, StepsSource } from '../types/steps'
import { MetricDataPoint, PeriodSelection } from '../types/metrics'
import { filterSeriesByPeriod, formatDateKey } from './metricsPeriod'

const INTEGRATION_SOURCE_LABELS: StepsSource[] = [
  'Apple Health',
  'Health Connect',
  'Galaxy Watch',
  'Mi Band',
]

export function mapIntegrationStepsSource(sourceLabel?: string): StepsSource {
  if (sourceLabel && INTEGRATION_SOURCE_LABELS.includes(sourceLabel as StepsSource)) {
    return sourceLabel as StepsSource
  }
  return 'Health Connect'
}

export function parseActivityDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date()
  date.setFullYear(year, month - 1, day)
  date.setHours(12, 0, 0, 0)
  return date
}

export function mapAtividadeDayRecordDto(day: AtividadeDayRecordDto): StepsDayRecord {
  const record: StepsDayRecord = {
    id: day.id,
    date: parseActivityDateKey(day.date),
    steps: day.steps,
    distanceKm: day.distanceKm,
    source: day.source === 'manual' ? 'Manual' : mapIntegrationStepsSource(day.sourceLabel),
  }

  return record
}

export function mapAtividadeDayRecordDtos(days: AtividadeDayRecordDto[]): StepsDayRecord[] {
  return days
    .map(mapAtividadeDayRecordDto)
    .sort((left, right) => right.date.getTime() - left.date.getTime())
}

export function mergeAtividadeDayRecord(
  records: StepsDayRecord[],
  day: StepsDayRecord,
): StepsDayRecord[] {
  const next = records.filter((record) => record.id !== day.id)
  return [day, ...next].sort((left, right) => right.date.getTime() - left.date.getTime())
}

export function buildManualWalkPayload(entry: ManualWalkEntry) {
  return {
    steps: entry.steps,
    durationMinutes: entry.durationMinutes,
  }
}

export function mockStepsDayToBatchDay(record: StepsDayRecord) {
  return {
    date: formatDateKey(record.date),
    steps: record.steps,
    distanceKm: record.distanceKm,
    sourceLabel: record.source === 'Manual' ? undefined : record.source,
  }
}

export function hasIntegrationStepsRecords(records: StepsDayRecord[]) {
  return records.some((record) => record.source !== 'Manual')
}

export function stepsDayRecordsToMetricPoints(records: StepsDayRecord[]): MetricDataPoint[] {
  return [...records]
    .sort((left, right) => left.date.getTime() - right.date.getTime())
    .map((record) => ({
      date: formatDateKey(record.date),
      value: record.steps,
    }))
}

export function stepsDayRecordsToDistanceMetricPoints(records: StepsDayRecord[]): MetricDataPoint[] {
  return [...records]
    .sort((left, right) => left.date.getTime() - right.date.getTime())
    .map((record) => ({
      date: formatDateKey(record.date),
      value: Number((record.distanceKm ?? record.steps * 0.000762).toFixed(2)),
    }))
}

export function getStepsSeriesForPeriod(
  records: StepsDayRecord[],
  period: PeriodSelection,
): MetricDataPoint[] {
  return filterSeriesByPeriod(stepsDayRecordsToMetricPoints(records), period)
}

export function getDistanceSeriesForPeriod(
  records: StepsDayRecord[],
  period: PeriodSelection,
): MetricDataPoint[] {
  return filterSeriesByPeriod(stepsDayRecordsToDistanceMetricPoints(records), period)
}

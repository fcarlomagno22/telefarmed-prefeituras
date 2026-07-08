import type { HeartRateHistoryEntryDto } from '../lib/api/vd/metricas'
import {
  HeartRateContext,
  HeartRateReading,
  HeartRateSource,
} from '../types/heartRate'
import { MetricDataPoint, PeriodSelection } from '../types/metrics'
import { filterSeriesByPeriod, formatDateKey, isHourlyPeriod } from './metricsPeriod'
import { sortHeartRateReadings } from './heartRate'

const INTEGRATION_SOURCE_LABELS: HeartRateSource[] = [
  'Apple Health',
  'Health Connect',
  'Galaxy Watch',
  'Mi Band',
]

export function mapIntegrationSourceLabel(sourceLabel?: string): HeartRateSource {
  if (
    sourceLabel &&
    INTEGRATION_SOURCE_LABELS.includes(sourceLabel as HeartRateSource)
  ) {
    return sourceLabel as HeartRateSource
  }
  return 'Health Connect'
}

export function mapHeartRateHistoryEntryDto(
  entry: HeartRateHistoryEntryDto,
): HeartRateReading {
  return {
    id: entry.id,
    bpm: entry.bpm,
    recordedAt: new Date(entry.recordedAt),
    source: entry.source === 'manual' ? 'Manual' : mapIntegrationSourceLabel(entry.sourceLabel),
    context: entry.context,
  }
}

export function mapHeartRateHistoryEntryDtos(
  entries: HeartRateHistoryEntryDto[],
): HeartRateReading[] {
  return sortHeartRateReadings(entries.map(mapHeartRateHistoryEntryDto))
}

export function mergeHeartRateReading(
  history: HeartRateReading[],
  reading: HeartRateReading,
): HeartRateReading[] {
  const next = history.filter((entry) => entry.id !== reading.id)
  return sortHeartRateReadings([reading, ...next])
}

export function buildOfflineHeartRateReading(input: {
  bpm: number
  recordedAt?: string
  source?: 'manual' | 'integracao'
  context?: HeartRateContext
  sourceLabel?: string
}): HeartRateReading {
  const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date()
  const source =
    input.source === 'integracao'
      ? mapIntegrationSourceLabel(input.sourceLabel)
      : 'Manual'

  return {
    id: `offline-${source}-${recordedAt.getTime()}-${input.bpm}`,
    bpm: Math.round(input.bpm),
    recordedAt,
    source,
    context: input.context ?? (input.source === 'integracao' ? 'resting' : 'manual'),
  }
}

export function heartRateReadingToRegisterInput(reading: HeartRateReading) {
  const isManual = reading.source === 'Manual' || reading.context === 'manual'

  return {
    bpm: reading.bpm,
    recordedAt: reading.recordedAt.toISOString(),
    source: isManual ? ('manual' as const) : ('integracao' as const),
    context: reading.context,
    sourceLabel: isManual ? undefined : reading.source,
  }
}

export function getLatestHeartRateReading(
  readings: HeartRateReading[],
): HeartRateReading | undefined {
  return sortHeartRateReadings(readings)[0]
}

export function heartRateReadingsToMetricPoints(
  readings: HeartRateReading[],
  hourly: boolean,
): MetricDataPoint[] {
  const sorted = sortHeartRateReadings(readings)

  if (hourly) {
    return sorted.map((reading) => ({
      date: formatDateKey(reading.recordedAt),
      hour: reading.recordedAt.getHours(),
      value: reading.bpm,
    }))
  }

  const latestByDay = new Map<string, HeartRateReading>()
  for (const reading of sorted) {
    latestByDay.set(formatDateKey(reading.recordedAt), reading)
  }

  return [...latestByDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, reading]) => ({
      date,
      value: reading.bpm,
    }))
}

export function getHeartRateSeriesForPeriod(
  readings: HeartRateReading[],
  period: PeriodSelection,
): MetricDataPoint[] {
  const points = heartRateReadingsToMetricPoints(readings, isHourlyPeriod(period))
  return filterSeriesByPeriod(points, period)
}

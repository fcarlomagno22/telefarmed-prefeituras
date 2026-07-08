import {
  BodyMeasurementHistory,
  StorableBodyMeasurementId,
} from '../types/bodyMeasurements'
import { MetricDataPoint } from '../types/metrics'
import type { MetricDataPointDto } from '../lib/api/vd/metricas'
import { getBodyMeasurementConfig } from './bodyMeasurements'
import { formatDateKey } from './metricsPeriod'

const STORABLE_IDS: StorableBodyMeasurementId[] = [
  'abdomen',
  'quadril',
  'peito',
  'cintura',
  'coxa',
  'braco',
  'pescoco',
]

export function isStorableBodyMeasurementKey(key: string): key is StorableBodyMeasurementId {
  return (STORABLE_IDS as string[]).includes(key)
}

export function formatBodyMeasurementValueCm(id: StorableBodyMeasurementId, raw: number) {
  const config = getBodyMeasurementConfig(id)
  const decimals = config.step < 1 ? 1 : 0
  return Number(Math.max(config.min, Math.min(config.max, raw)).toFixed(decimals))
}

export function sortBodyMeasurementSeries(points: MetricDataPoint[]): MetricDataPoint[] {
  return [...points].sort((left, right) => left.date.localeCompare(right.date))
}

export function upsertDailyBodyMeasurementPoint(
  series: MetricDataPoint[],
  point: MetricDataPoint,
): MetricDataPoint[] {
  const next = [...series]
  const existingIndex = next.findIndex((entry) => entry.date === point.date)

  if (existingIndex >= 0) {
    next[existingIndex] = point
  } else {
    next.push(point)
  }

  return sortBodyMeasurementSeries(next)
}

export function mergeBodyMeasurementPoint(
  history: BodyMeasurementHistory,
  measurementId: StorableBodyMeasurementId,
  point: MetricDataPoint,
): BodyMeasurementHistory {
  return {
    ...history,
    [measurementId]: upsertDailyBodyMeasurementPoint(history[measurementId] ?? [], point),
  }
}

export function mapBodyMeasurementsDto(
  measurements: Partial<Record<StorableBodyMeasurementId, MetricDataPointDto[]>>,
): BodyMeasurementHistory {
  const history: BodyMeasurementHistory = {}

  for (const id of STORABLE_IDS) {
    const points = measurements[id]
    if (!points?.length) continue
    history[id] = sortBodyMeasurementSeries(
      points.map((point) => ({
        date: point.date,
        value: point.value,
        ...(point.hour !== undefined ? { hour: point.hour } : {}),
      })),
    )
  }

  return history
}

export function buildOfflineBodyMeasurementPoint(
  measurementId: StorableBodyMeasurementId,
  valueCm: number,
  recordedAt?: string,
): MetricDataPoint {
  const at = recordedAt ? new Date(recordedAt) : new Date()
  return {
    date: formatDateKey(at),
    value: formatBodyMeasurementValueCm(measurementId, valueCm),
  }
}

export function getLatestBodyMeasurementSeriesValue(
  history: BodyMeasurementHistory,
  measurementId: StorableBodyMeasurementId,
): number | undefined {
  const series = history[measurementId]
  if (!series?.length) return undefined
  return series[series.length - 1]?.value
}

import {
  BodyMeasurementHistory,
  BodyMeasurementId,
  StorableBodyMeasurementId,
} from '../types/bodyMeasurements'
import { MetricDataPoint, PeriodSelection, ProfileSnapshot } from '../types/metrics'
import {
  BODY_MEASUREMENT_CONFIGS,
  buildWaistHipRatioSeries,
  getBodyMeasurementConfig,
  isStorableBodyMeasurementId,
} from '../utils/bodyMeasurements'
import { parseWeightKg } from '../utils/bmi'
import { filterSeriesByPeriod, formatDateKey } from '../utils/metricsPeriod'
import { createExtendedWeightHistory } from './mockHealthMetrics'

const HISTORY_DAYS = 90

export const BODY_MEASUREMENT_CHART_PERIOD = 'last30days' as const

function seededNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function sortSeries(points: MetricDataPoint[]) {
  return [...points].sort((left, right) => left.date.localeCompare(right.date))
}

function formatStoredValue(id: StorableBodyMeasurementId, raw: number) {
  const config = getBodyMeasurementConfig(id)
  const decimals = config.step < 1 ? 1 : 0
  return Number(Math.max(config.min, Math.min(config.max, raw)).toFixed(decimals))
}

function createPesoMeasurementSeries(
  weightHistory: MetricDataPoint[],
  profile: ProfileSnapshot,
  days = HISTORY_DAYS,
): MetricDataPoint[] {
  return createExtendedWeightHistory(weightHistory, profile, days)
}

function generateSeedSeries(id: StorableBodyMeasurementId, days = HISTORY_DAYS): MetricDataPoint[] {
  const config = getBodyMeasurementConfig(id)
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - 1 - index))
    const noise = seededNoise(index + id.length * 5) - 0.5
    const wave = Math.sin(index / 5) * config.step * 2
    const trend = (index - days / 2) * (config.step * 0.04)
    const raw = config.defaultValue + wave + trend + noise * config.step

    return {
      date: formatDateKey(date),
      value: formatStoredValue(id, raw),
    }
  })
}

export function createInitialBodyMeasurementHistory(): BodyMeasurementHistory {
  const history: BodyMeasurementHistory = {}

  for (const config of BODY_MEASUREMENT_CONFIGS) {
    if (!isStorableBodyMeasurementId(config.id)) continue
    history[config.id] = generateSeedSeries(config.id)
  }

  return history
}

function upsertDailyPoint(series: MetricDataPoint[], point: MetricDataPoint) {
  const next = [...series]
  const existingIndex = next.findIndex((entry) => entry.date === point.date)

  if (existingIndex >= 0) {
    next[existingIndex] = point
  } else {
    next.push(point)
  }

  return sortSeries(next)
}

export function registerBodyMeasurementInHistory(
  history: BodyMeasurementHistory,
  id: StorableBodyMeasurementId,
  value: number,
  _period: PeriodSelection,
  at: Date = new Date(),
): BodyMeasurementHistory {
  const point: MetricDataPoint = {
    date: formatDateKey(at),
    value: formatStoredValue(id, value),
  }

  return {
    ...history,
    [id]: upsertDailyPoint(history[id] ?? [], point),
  }
}

function applyMeasurementOverride(series: MetricDataPoint[], override?: number) {
  if (override === undefined) return series

  const today = formatDateKey(new Date())
  const next = [...series]
  const existingIndex = next.findIndex((point) => point.date === today)

  if (existingIndex >= 0) {
    next[existingIndex] = { date: today, value: override }
  } else {
    next.push({ date: today, value: override })
  }

  return sortSeries(next)
}

function getWaistSeries(
  history: BodyMeasurementHistory,
  overrides?: Partial<Record<BodyMeasurementId, number>>,
): MetricDataPoint[] {
  const cintura = applyMeasurementOverride(history.cintura ?? [], overrides?.cintura)
  const abdomen = applyMeasurementOverride(history.abdomen ?? generateSeedSeries('abdomen'), overrides?.abdomen)

  if (cintura.length === 0) return abdomen
  if (abdomen.length === 0) return cintura

  const byDate = new Map<string, number>()
  for (const point of abdomen) byDate.set(point.date, point.value)
  for (const point of cintura) byDate.set(point.date, point.value)

  return sortSeries(
    [...byDate.entries()].map(([date, value]) => ({
      date,
      value,
    })),
  )
}

export function getBodyMeasurementSeries(
  id: BodyMeasurementId,
  history: BodyMeasurementHistory,
  weightHistory: MetricDataPoint[],
  profile: ProfileSnapshot,
  overrides?: Partial<Record<BodyMeasurementId, number>>,
): MetricDataPoint[] {
  if (id === 'peso') {
    return createPesoMeasurementSeries(weightHistory, profile)
  }

  if (id === 'cintura_quadril') {
    return buildWaistHipRatioSeries(
      getWaistSeries(history, overrides),
      applyMeasurementOverride(history.quadril ?? generateSeedSeries('quadril'), overrides?.quadril),
    )
  }

  if (!isStorableBodyMeasurementId(id)) return []

  return applyMeasurementOverride(history[id] ?? generateSeedSeries(id), overrides?.[id])
}

export function getBodyMeasurementSeriesForPeriod(
  id: BodyMeasurementId,
  history: BodyMeasurementHistory,
  weightHistory: MetricDataPoint[],
  profile: ProfileSnapshot,
  period: PeriodSelection,
  overrides?: Partial<Record<BodyMeasurementId, number>>,
): MetricDataPoint[] {
  const series = getBodyMeasurementSeries(id, history, weightHistory, profile, overrides)
  return filterSeriesByPeriod(series, period)
}

export function getLatestBodyMeasurementValue(
  id: BodyMeasurementId,
  history: BodyMeasurementHistory,
  weightHistory: MetricDataPoint[],
  profile: ProfileSnapshot,
  overrides?: Partial<Record<BodyMeasurementId, number>>,
): number {
  if (overrides?.[id] !== undefined) return overrides[id]!

  if (id === 'peso') {
    const fromProfile = parseWeightKg(profile.weight)
    if (fromProfile !== null) return fromProfile
    const series = getBodyMeasurementSeries(id, history, weightHistory, profile)
    return series[series.length - 1]?.value ?? getBodyMeasurementConfig(id).defaultValue
  }

  if (id === 'cintura_quadril') {
    const ratioSeries = buildWaistHipRatioSeries(
      getWaistSeries(history, overrides),
      applyMeasurementOverride(history.quadril ?? generateSeedSeries('quadril'), overrides?.quadril),
    )
    return ratioSeries[ratioSeries.length - 1]?.value ?? getBodyMeasurementConfig(id).defaultValue
  }

  if (!isStorableBodyMeasurementId(id)) {
    return getBodyMeasurementConfig(id).defaultValue
  }

  const series = history[id] ?? generateSeedSeries(id)
  return series[series.length - 1]?.value ?? getBodyMeasurementConfig(id).defaultValue
}

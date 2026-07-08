import {
  BodyMeasurementHistory,
  BodyMeasurementId,
} from '../types/bodyMeasurements'
import { MetricDataPoint, PeriodSelection, ProfileSnapshot } from '../types/metrics'
import {
  buildWaistHipRatioSeries,
  getBodyMeasurementConfig,
  isStorableBodyMeasurementId,
} from '../utils/bodyMeasurements'
import { parseWeightKg } from '../utils/bmi'
import { filterSeriesByPeriod, formatDateKey } from '../utils/metricsPeriod'
import { sortWeightHistory } from '../utils/weightHistory'

const HISTORY_DAYS = 90

export const BODY_MEASUREMENT_CHART_PERIOD = 'last30days' as const

function sortSeries(points: MetricDataPoint[]) {
  return [...points].sort((left, right) => left.date.localeCompare(right.date))
}

function createPesoMeasurementSeries(
  weightHistory: MetricDataPoint[],
  profile: ProfileSnapshot,
  days = HISTORY_DAYS,
): MetricDataPoint[] {
  void profile
  const sorted = sortWeightHistory(weightHistory)
  if (sorted.length <= days) return sorted

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - (days - 1))
  const cutoffKey = formatDateKey(cutoff)
  return sorted.filter((point) => point.date >= cutoffKey)
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
  const abdomen = applyMeasurementOverride(history.abdomen ?? [], overrides?.abdomen)

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
      applyMeasurementOverride(history.quadril ?? [], overrides?.quadril),
    )
  }

  if (!isStorableBodyMeasurementId(id)) return []

  return applyMeasurementOverride(history[id] ?? [], overrides?.[id])
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
      applyMeasurementOverride(history.quadril ?? [], overrides?.quadril),
    )
    return ratioSeries[ratioSeries.length - 1]?.value ?? getBodyMeasurementConfig(id).defaultValue
  }

  if (!isStorableBodyMeasurementId(id)) {
    return getBodyMeasurementConfig(id).defaultValue
  }

  const series = history[id] ?? []
  return series[series.length - 1]?.value ?? getBodyMeasurementConfig(id).defaultValue
}

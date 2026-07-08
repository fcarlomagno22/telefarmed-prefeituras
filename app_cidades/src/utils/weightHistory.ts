import { MetricDataPoint, PeriodSelection, ProfileSnapshot } from '../types/metrics'
import { calculateImc, parseHeightMeters, parseWeightKg } from './bmi'
import { filterSeriesByPeriod, formatDateKey } from './metricsPeriod'

export function sortWeightHistory(points: MetricDataPoint[]): MetricDataPoint[] {
  return [...points].sort((left, right) => {
    if (left.date !== right.date) return left.date.localeCompare(right.date)
    return (left.hour ?? 0) - (right.hour ?? 0)
  })
}

export function getWeightSeriesForPeriod(
  history: MetricDataPoint[],
  period: PeriodSelection,
): MetricDataPoint[] {
  return filterSeriesByPeriod(sortWeightHistory(history), period)
}

/** Exibe ao menos o peso atual do perfil quando ainda não há histórico real. */
export function ensureMinimumWeightChartPoints(
  history: MetricDataPoint[],
  profile: ProfileSnapshot,
): MetricDataPoint[] {
  const sorted = sortWeightHistory(history)
  if (sorted.length > 0) return sorted

  const weightKg = parseWeightKg(profile.weight)
  if (weightKg === null) return []

  return [{ date: formatDateKey(new Date()), value: weightKg }]
}

export function buildImcSeriesFromWeightHistory(
  weightHistory: MetricDataPoint[],
  profile: ProfileSnapshot,
): MetricDataPoint[] {
  const heightMeters = parseHeightMeters(profile.height)
  if (!heightMeters) return []

  return sortWeightHistory(weightHistory).map((point) => ({
    date: point.date,
    ...(point.hour !== undefined ? { hour: point.hour } : {}),
    value: Number((point.value / (heightMeters * heightMeters)).toFixed(1)),
  }))
}

export function getImcValueFromProfile(profile: ProfileSnapshot): number | null {
  return calculateImc(profile)
}

export function mergeWeightPoint(
  history: MetricDataPoint[],
  point: MetricDataPoint,
): MetricDataPoint[] {
  const next = [...history]
  const existingIndex = next.findIndex(
    (entry) => entry.date === point.date && (entry.hour ?? -1) === (point.hour ?? -1),
  )

  if (existingIndex >= 0) {
    next[existingIndex] = point
  } else {
    next.push(point)
  }

  return sortWeightHistory(next)
}

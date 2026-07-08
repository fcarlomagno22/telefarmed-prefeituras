import { GlucoseHistoryEntry } from '../types/glucose'
import { MetricDataPoint, PeriodSelection } from '../types/metrics'
import { filterSeriesByPeriod, formatDateKey, isHourlyPeriod } from './metricsPeriod'

export function getLatestGlucoseEntry(entries: GlucoseHistoryEntry[]): GlucoseHistoryEntry | null {
  if (!entries.length) return null

  return [...entries].sort(
    (left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
  )[0]
}

export function sortGlucoseHistory(entries: GlucoseHistoryEntry[]): GlucoseHistoryEntry[] {
  return [...entries].sort(
    (left, right) => new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime(),
  )
}

export function mergeGlucoseReading(
  history: GlucoseHistoryEntry[],
  entry: GlucoseHistoryEntry,
): GlucoseHistoryEntry[] {
  const withoutDuplicate = history.filter((item) => item.id !== entry.id)
  return sortGlucoseHistory([...withoutDuplicate, entry])
}

export function glucoseHistoryToMetricPoints(
  entries: GlucoseHistoryEntry[],
  hourly: boolean,
): MetricDataPoint[] {
  const sorted = sortGlucoseHistory(entries)

  if (hourly) {
    return sorted.map((entry) => {
      const recordedAt = new Date(entry.recordedAt)
      return {
        date: formatDateKey(recordedAt),
        hour: recordedAt.getHours(),
        value: entry.amountMg,
      }
    })
  }

  const latestByDay = new Map<string, GlucoseHistoryEntry>()
  for (const entry of sorted) {
    latestByDay.set(formatDateKey(new Date(entry.recordedAt)), entry)
  }

  return [...latestByDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, entry]) => ({
      date,
      value: entry.amountMg,
    }))
}

export function getGlucoseSeriesForPeriod(
  history: GlucoseHistoryEntry[],
  period: PeriodSelection,
): MetricDataPoint[] {
  const points = glucoseHistoryToMetricPoints(history, isHourlyPeriod(period))
  return filterSeriesByPeriod(points, period)
}

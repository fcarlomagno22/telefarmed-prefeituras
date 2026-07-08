import { BloodPressureHistoryEntry } from '../types/bloodPressure'
import { MetricDataPoint, PeriodSelection } from '../types/metrics'
import { filterBloodPressureHistoryByPeriod } from './bloodPressure'
import { formatDateKey, isHourlyPeriod } from './metricsPeriod'

export function getLatestBloodPressureEntry(
  entries: BloodPressureHistoryEntry[],
): BloodPressureHistoryEntry | null {
  if (!entries.length) return null

  return [...entries].sort(
    (left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
  )[0]
}

export function sortBloodPressureHistoryAscending(
  entries: BloodPressureHistoryEntry[],
): BloodPressureHistoryEntry[] {
  return [...entries].sort(
    (left, right) => new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime(),
  )
}

export function mergeBloodPressureReading(
  history: BloodPressureHistoryEntry[],
  entry: BloodPressureHistoryEntry,
): BloodPressureHistoryEntry[] {
  const withoutDuplicate = history.filter((item) => item.id !== entry.id)
  return sortBloodPressureHistoryAscending([...withoutDuplicate, entry])
}

/** Converte leituras de pressão em pontos de gráfico (sistólica + diastólica). */
export function bloodPressureHistoryToMetricPoints(
  entries: BloodPressureHistoryEntry[],
  hourly: boolean,
): MetricDataPoint[] {
  const sorted = sortBloodPressureHistoryAscending(entries)

  if (hourly) {
    return sorted.map((entry) => {
      const recordedAt = new Date(entry.recordedAt)
      return {
        date: formatDateKey(recordedAt),
        hour: recordedAt.getHours(),
        value: entry.systolic,
        diastolic: entry.diastolic,
      }
    })
  }

  const latestByDay = new Map<string, BloodPressureHistoryEntry>()
  for (const entry of sorted) {
    latestByDay.set(formatDateKey(new Date(entry.recordedAt)), entry)
  }

  return [...latestByDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, entry]) => ({
      date,
      value: entry.systolic,
      diastolic: entry.diastolic,
    }))
}

export function getBloodPressureSeriesForPeriod(
  history: BloodPressureHistoryEntry[],
  period: PeriodSelection,
): MetricDataPoint[] {
  const filtered = filterBloodPressureHistoryByPeriod(history, period.start, period.end)
  return bloodPressureHistoryToMetricPoints(filtered, isHourlyPeriod(period))
}

import { HydrationDayRecord } from '../types/hydration'
import { MetricDataPoint, PeriodSelection } from '../types/metrics'
import { mlToLiters } from './hydration'
import { filterSeriesByPeriod } from './metricsPeriod'

export function sortHydrationDays(records: HydrationDayRecord[]): HydrationDayRecord[] {
  return [...records].sort((left, right) => right.date.localeCompare(left.date))
}

export function mergeHydrationDay(
  history: HydrationDayRecord[],
  day: HydrationDayRecord,
): HydrationDayRecord[] {
  const withoutDuplicate = history.filter((item) => item.date !== day.date)
  return sortHydrationDays([...withoutDuplicate, day])
}

export function hydrationHistoryToMetricPoints(records: HydrationDayRecord[]): MetricDataPoint[] {
  return [...records]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((record) => ({
      date: record.date,
      value: mlToLiters(record.totalMl),
    }))
}

export function getHydrationSeriesForPeriod(
  history: HydrationDayRecord[],
  period: PeriodSelection,
): MetricDataPoint[] {
  return filterSeriesByPeriod(hydrationHistoryToMetricPoints(history), period)
}

import { DEFAULT_HYDRATION_GOAL_ML } from '../data/mockHydrationHistory'
import {
  HydrationDayHighlight,
  HydrationDayRecord,
  HydrationReportSummary,
  HydrationTrendBucket,
  HydrationTrendDirection,
} from '../types/hydration'
import { PeriodSelection } from '../types/metrics'
import {
  formatHydrationDateLabel,
  formatHydrationDual,
  formatHydrationLiters,
  formatHydrationMl,
  isBelowHydrationGoal,
  mlToLiters,
} from '../data/mockHydrationHistory'
import { formatPeriodLabel, formatDateKey, parseDateKey } from './metricsPeriod'

function formatDayBucketLabel(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function filterHydrationByPeriod(records: HydrationDayRecord[], period: PeriodSelection) {
  const startKey = formatDateKey(period.start)
  const endKey = formatDateKey(period.end)

  return [...records]
    .filter((record) => record.date >= startKey && record.date <= endKey)
    .sort((left, right) => left.date.localeCompare(right.date))
}

function buildTrendBuckets(days: HydrationDayRecord[]): HydrationTrendBucket[] {
  return days.map((day) => ({
    label: formatDayBucketLabel(day.date),
    avg: mlToLiters(day.totalMl),
    count: 1,
  }))
}

function resolveTrendDirection(buckets: HydrationTrendBucket[]): {
  direction: HydrationTrendDirection
  changePct: number
} {
  if (buckets.length < 2) {
    return { direction: 'stable', changePct: 0 }
  }

  const first = buckets[0].avg
  const last = buckets[buckets.length - 1].avg
  if (first === 0) return { direction: 'stable', changePct: 0 }

  const changePct = Math.round(((last - first) / first) * 100)
  if (Math.abs(changePct) < 4) return { direction: 'stable', changePct }
  return { direction: changePct > 0 ? 'up' : 'down', changePct }
}

function toDayHighlight(record: HydrationDayRecord, goalMl: number): HydrationDayHighlight {
  return {
    date: record.date,
    totalMl: record.totalMl,
    belowGoal: isBelowHydrationGoal(record.totalMl, goalMl),
  }
}

export function getHydrationTrendDirectionLabel(direction: HydrationTrendDirection) {
  if (direction === 'up') return 'Em alta'
  if (direction === 'down') return 'Em queda'
  return 'Estavel'
}

export function formatHydrationGoalLabel(goalMl: number) {
  return formatHydrationDual(goalMl)
}

export function buildHydrationReport(
  records: HydrationDayRecord[],
  period: PeriodSelection,
  goalMl = DEFAULT_HYDRATION_GOAL_ML,
): HydrationReportSummary {
  const days = filterHydrationByPeriod(records, period)
  const belowGoalDays = days.filter((day) => isBelowHydrationGoal(day.totalMl, goalMl))
  const totalMl = days.reduce((sum, day) => sum + day.totalMl, 0)
  const dailyAverageMl = days.length > 0 ? Math.round(totalMl / days.length) : 0
  const trendBuckets = buildTrendBuckets(days)
  const trend = resolveTrendDirection(trendBuckets)

  const sortedByIntake = [...days].sort((left, right) => right.totalMl - left.totalMl)
  const bestDay = sortedByIntake[0] ? toDayHighlight(sortedByIntake[0], goalMl) : null
  const worstDay = sortedByIntake[sortedByIntake.length - 1]
    ? toDayHighlight(sortedByIntake[sortedByIntake.length - 1], goalMl)
    : null

  return {
    periodLabel: formatPeriodLabel(period),
    periodStart: period.start,
    periodEnd: period.end,
    goalMl,
    goalL: mlToLiters(goalMl),
    totalMl,
    totalL: mlToLiters(totalMl),
    dailyAverageMl,
    dailyAverageL: mlToLiters(dailyAverageMl),
    daysTracked: days.length,
    daysBelowGoal: belowGoalDays.length,
    daysAtOrAboveGoal: days.length - belowGoalDays.length,
    belowGoalPct: days.length > 0 ? Math.round((belowGoalDays.length / days.length) * 100) : 0,
    atOrAboveGoalPct:
      days.length > 0
        ? Math.round(((days.length - belowGoalDays.length) / days.length) * 100)
        : 0,
    bestDay,
    worstDay,
    trend: {
      direction: trend.direction,
      changePct: trend.changePct,
      buckets: trendBuckets,
    },
    belowGoalDays: [...belowGoalDays].sort((left, right) => right.date.localeCompare(left.date)),
    days: [...days].sort((left, right) => right.date.localeCompare(left.date)),
  }
}

export { formatHydrationDateLabel, formatHydrationDual, formatHydrationLiters, formatHydrationMl }

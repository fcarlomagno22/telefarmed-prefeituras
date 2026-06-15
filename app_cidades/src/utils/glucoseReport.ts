import {
  GlucoseContextStats,
  GlucoseHistoryEntry,
  GlucoseReportSummary,
  GlucoseTrendBucket,
  GlucoseTrendDirection,
} from '../types/glucose'
import { PeriodSelection } from '../types/metrics'
import {
  filterGlucoseHistoryByPeriod,
  getGlucoseContextLabel,
  isGlucoseInTarget,
  isHyperglycemiaPeak,
  isHypoglycemia,
  sortGlucoseHistory,
} from './glucose'
import { formatPeriodLabel } from './metricsPeriod'

function average(values: number[]) {
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function buildContextStats(entries: GlucoseHistoryEntry[]): GlucoseContextStats | null {
  if (entries.length === 0) return null

  const inTargetCount = entries.filter((entry) =>
    isGlucoseInTarget(entry.amountMg, entry.context),
  ).length
  const inTargetPct = Math.round((inTargetCount / entries.length) * 100)
  const outOfTargetPct = 100 - inTargetPct

  return {
    count: entries.length,
    avg: average(entries.map((entry) => entry.amountMg)),
    inTargetPct,
    outOfTargetPct,
  }
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function formatDayBucketLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function buildTrendBuckets(entries: GlucoseHistoryEntry[]): GlucoseTrendBucket[] {
  if (entries.length === 0) return []

  const bucketMap = new Map<string, { label: string; values: number[]; sortKey: number }>()

  entries.forEach((entry) => {
    const dayStart = startOfDay(new Date(entry.recordedAt))
    const key = dayStart.toISOString()
    bucketMap.set(key, {
      label: formatDayBucketLabel(dayStart),
      values: [...(bucketMap.get(key)?.values ?? []), entry.amountMg],
      sortKey: dayStart.getTime(),
    })
  })

  return [...bucketMap.values()]
    .sort((left, right) => left.sortKey - right.sortKey)
    .map((bucket) => ({
      label: bucket.label,
      avg: average(bucket.values),
      count: bucket.values.length,
    }))
}

function resolveTrendDirection(buckets: GlucoseTrendBucket[]): {
  direction: GlucoseTrendDirection
  changePct: number
} {
  if (buckets.length < 2) {
    return { direction: 'stable', changePct: 0 }
  }

  const first = buckets[0].avg
  const last = buckets[buckets.length - 1].avg
  if (first === 0) return { direction: 'stable', changePct: 0 }

  const changePct = Math.round(((last - first) / first) * 100)
  if (Math.abs(changePct) < 5) return { direction: 'stable', changePct }
  return { direction: changePct > 0 ? 'up' : 'down', changePct }
}

export function buildGlucoseReport(
  history: GlucoseHistoryEntry[],
  period: PeriodSelection,
): GlucoseReportSummary {
  const filtered = sortGlucoseHistory(filterGlucoseHistoryByPeriod(history, period.start, period.end))
  const values = filtered.map((entry) => entry.amountMg)
  const inTargetCount = filtered.filter((entry) =>
    isGlucoseInTarget(entry.amountMg, entry.context),
  ).length
  const inTargetPct = filtered.length > 0 ? Math.round((inTargetCount / filtered.length) * 100) : 0

  const fastingEntries = filtered.filter((entry) => entry.context === 'fasting')
  const postMealEntries = filtered.filter((entry) => entry.context === 'post_meal')
  const preMealEntries = filtered.filter((entry) => entry.context === 'pre_meal')

  const hypoglycemiaReadings = filtered.filter((entry) => isHypoglycemia(entry.amountMg))
  const hyperglycemiaReadings = filtered.filter((entry) =>
    isHyperglycemiaPeak(entry.amountMg, entry.context),
  )

  const trendBuckets = buildTrendBuckets(filtered)
  const trendDirection = resolveTrendDirection(trendBuckets)

  return {
    periodLabel: formatPeriodLabel(period),
    periodStart: period.start,
    periodEnd: period.end,
    totalReadings: filtered.length,
    overall: {
      min: values.length > 0 ? Math.min(...values) : 0,
      max: values.length > 0 ? Math.max(...values) : 0,
      avg: average(values),
      inTargetPct,
      outOfTargetPct: 100 - inTargetPct,
    },
    fasting: buildContextStats(fastingEntries),
    postMeal: buildContextStats(postMealEntries),
    preMeal: buildContextStats(preMealEntries),
    hypoglycemia: {
      count: hypoglycemiaReadings.length,
      readings: hypoglycemiaReadings.slice(0, 8),
    },
    hyperglycemia: {
      count: hyperglycemiaReadings.length,
      readings: hyperglycemiaReadings.slice(0, 8),
    },
    trend: {
      buckets: trendBuckets,
      ...trendDirection,
    },
    readings: filtered,
  }
}

export function getTrendDirectionLabel(direction: GlucoseTrendDirection) {
  if (direction === 'up') return 'Em ascensão'
  if (direction === 'down') return 'Em queda'
  return 'Estável'
}

export function getGlucoseReadingSummaryLine(entry: GlucoseHistoryEntry) {
  return `${formatGlucoseValue(entry.amountMg)} · ${getGlucoseContextLabel(entry.context)}`
}

function formatGlucoseValue(mg: number) {
  return `${Math.round(mg)} mg/dL`
}

export { getGlucoseContextLabel }

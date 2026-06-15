import {
  HeartRateEffortInsight,
  HeartRateReading,
  HeartRateReportSummary,
  HeartRateTrendBucket,
  HeartRateTrendDirection,
} from '../types/heartRate'
import { PeriodSelection } from '../types/metrics'
import { StepsDayRecord } from '../types/steps'
import { estimateDistanceKm, formatDistanceKmLabel, formatStepsCount } from '../data/mockStepsHistory'
import {
  filterHeartRateReadingsByPeriod,
  HEART_RATE_NORMAL_MAX_BPM,
  isBradycardia,
  isHighHeartRatePeak,
  isPeakAboveNormal,
  isRestingHeartRateContext,
  isWorkoutHeartRateContext,
  sortHeartRateReadings,
  summarizeHeartRate,
} from './heartRate'
import { formatPeriodLabel } from './metricsPeriod'

function average(values: number[]) {
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function formatDayBucketLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function filterStepsByMetricsPeriod(
  records: StepsDayRecord[],
  periodStart: Date,
  periodEnd: Date,
) {
  const startMs = startOfDay(periodStart).getTime()
  const endMs = periodEnd.getTime()

  return records.filter((record) => {
    const timestamp = startOfDay(record.date).getTime()
    return timestamp >= startMs && timestamp <= endMs
  })
}

function buildTrendBuckets(readings: HeartRateReading[]): HeartRateTrendBucket[] {
  if (readings.length === 0) return []

  const bucketMap = new Map<
    string,
    { label: string; values: number[]; restingValues: number[]; sortKey: number }
  >()

  readings.forEach((reading) => {
    const dayStart = startOfDay(reading.recordedAt)
    const key = dayStart.toISOString()
    const existing = bucketMap.get(key)

    bucketMap.set(key, {
      label: formatDayBucketLabel(dayStart),
      values: [...(existing?.values ?? []), reading.bpm],
      restingValues: isRestingHeartRateContext(reading.context)
        ? [...(existing?.restingValues ?? []), reading.bpm]
        : (existing?.restingValues ?? []),
      sortKey: dayStart.getTime(),
    })
  })

  return [...bucketMap.values()]
    .sort((left, right) => left.sortKey - right.sortKey)
    .map((bucket) => ({
      label: bucket.label,
      avgBpm: average(bucket.values),
      avgRestingBpm: average(bucket.restingValues),
      count: bucket.values.length,
    }))
}

function resolveTrendDirection(buckets: HeartRateTrendBucket[]): {
  direction: HeartRateTrendDirection
  changePct: number
} {
  if (buckets.length < 2) {
    return { direction: 'stable', changePct: 0 }
  }

  const restingBuckets = buckets.filter((bucket) => bucket.avgRestingBpm > 0)
  const series =
    restingBuckets.length >= 2
      ? restingBuckets.map((bucket) => bucket.avgRestingBpm)
      : buckets.map((bucket) => bucket.avgBpm)

  const first = series[0]
  const last = series[series.length - 1]
  if (first === 0) return { direction: 'stable', changePct: 0 }

  const changePct = Math.round(((last - first) / first) * 100)
  if (Math.abs(changePct) < 4) return { direction: 'stable', changePct }
  return { direction: changePct > 0 ? 'up' : 'down', changePct }
}

function buildEffortInsight(
  readings: HeartRateReading[],
  stepsRecords: StepsDayRecord[],
  periodStart: Date,
  periodEnd: Date,
  hasActivityIntegration: boolean,
): HeartRateEffortInsight {
  if (!hasActivityIntegration) {
    return {
      available: false,
      activeDayCount: 0,
      avgWorkoutBpm: 0,
      avgRestingBpm: 0,
      avgStepsOnActiveDays: 0,
      avgDistanceKmOnActiveDays: 0,
      summary:
        'Conecte passos ou distância para ver a relação entre esforço físico e frequência cardíaca.',
    }
  }

  const stepsInPeriod = filterStepsByMetricsPeriod(stepsRecords, periodStart, periodEnd)
  const restingReadings = readings.filter((reading) => isRestingHeartRateContext(reading.context))
  const workoutReadings = readings.filter((reading) => isWorkoutHeartRateContext(reading.context))
  const avgRestingBpm = average(restingReadings.map((reading) => reading.bpm))
  const avgWorkoutBpm = average(workoutReadings.map((reading) => reading.bpm))

  const activeDayKeys = new Set<string>()
  workoutReadings.forEach((reading) => {
    activeDayKeys.add(startOfDay(reading.recordedAt).toISOString())
  })
  stepsInPeriod
    .filter((record) => record.steps >= 5000)
    .forEach((record) => {
      activeDayKeys.add(startOfDay(record.date).toISOString())
    })

  const stepsOnActiveDays = stepsInPeriod.filter((record) =>
    activeDayKeys.has(startOfDay(record.date).toISOString()),
  )
  const avgStepsOnActiveDays = average(stepsOnActiveDays.map((record) => record.steps))
  const avgDistanceKmOnActiveDays = Number(
    (
      stepsOnActiveDays.reduce((sum, record) => sum + estimateDistanceKm(record.steps), 0) /
      (stepsOnActiveDays.length || 1)
    ).toFixed(2),
  )

  let summary = 'Sem dados de esforço ou passos no período selecionado.'
  if (workoutReadings.length > 0 && stepsOnActiveDays.length > 0) {
    summary = `Média em repouso ${avgRestingBpm} bpm vs ${avgWorkoutBpm} bpm no esforço. Em ${activeDayKeys.size} dias ativos: ~${formatStepsCount(avgStepsOnActiveDays)} passos (${formatDistanceKmLabel(avgDistanceKmOnActiveDays)}).`
  } else if (workoutReadings.length > 0) {
    summary = `Média em repouso ${avgRestingBpm} bpm vs ${avgWorkoutBpm} bpm durante esforço registrado (${workoutReadings.length} leituras).`
  } else if (stepsOnActiveDays.length > 0) {
    summary = `Em ${activeDayKeys.size} dias com atividade (~${formatStepsCount(avgStepsOnActiveDays)} passos), não há leituras de FC marcadas como esforço. Use integração ou registre treinos para comparar picos.`
  }

  return {
    available: true,
    activeDayCount: activeDayKeys.size,
    avgWorkoutBpm,
    avgRestingBpm,
    avgStepsOnActiveDays,
    avgDistanceKmOnActiveDays,
    summary,
  }
}

export function getHeartRateTrendDirectionLabel(direction: HeartRateTrendDirection) {
  if (direction === 'up') return 'Em alta'
  if (direction === 'down') return 'Em queda'
  return 'Estável'
}

export function buildHeartRateReport(
  readings: HeartRateReading[],
  period: PeriodSelection,
  options?: {
    stepsRecords?: StepsDayRecord[]
    hasActivityIntegration?: boolean
  },
): HeartRateReportSummary {
  const filtered = sortHeartRateReadings(
    filterHeartRateReadingsByPeriod(readings, period.start, period.end),
  )
  const restingReadings = filtered.filter((reading) => isRestingHeartRateContext(reading.context))
  const workoutReadings = filtered.filter((reading) => isWorkoutHeartRateContext(reading.context))
  const peaksAboveNormalReadings = filtered.filter((reading) =>
    isPeakAboveNormal(reading.bpm),
  )
  const highPeakReadings = filtered.filter((reading) => isHighHeartRatePeak(reading.bpm))
  const bradycardiaReadings = filtered.filter((reading) => isBradycardia(reading.bpm))
  const restingSummary = summarizeHeartRate(restingReadings)
  const trendBuckets = buildTrendBuckets(filtered)
  const trend = resolveTrendDirection(trendBuckets)

  return {
    periodLabel: formatPeriodLabel(period),
    periodStart: period.start,
    periodEnd: period.end,
    totalReadings: filtered.length,
    overall: summarizeHeartRate(filtered),
    resting: restingSummary,
    restingAvg: restingSummary.avg,
    workout: summarizeHeartRate(workoutReadings),
    peaksAboveNormal: {
      count: peaksAboveNormalReadings.length,
      pct:
        filtered.length > 0
          ? Math.round((peaksAboveNormalReadings.length / filtered.length) * 100)
          : 0,
      threshold: HEART_RATE_NORMAL_MAX_BPM,
      readings: peaksAboveNormalReadings,
    },
    highPeaks: {
      count: highPeakReadings.length,
      readings: highPeakReadings,
    },
    bradycardia: {
      count: bradycardiaReadings.length,
      readings: bradycardiaReadings,
    },
    effort: buildEffortInsight(
      filtered,
      options?.stepsRecords ?? [],
      period.start,
      period.end,
      options?.hasActivityIntegration ?? false,
    ),
    trend: {
      buckets: trendBuckets,
      direction: trend.direction,
      changePct: trend.changePct,
    },
    readings: filtered,
  }
}

export function mapHeartRateTrendToChartBuckets(buckets: HeartRateTrendBucket[]) {
  return buckets.map((bucket) => ({
    label: bucket.label,
    avg: bucket.avgBpm,
    count: bucket.count,
  }))
}

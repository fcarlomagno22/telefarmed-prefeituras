import { getBodyMeasurementSeriesForPeriod } from '../data/bodyMeasurements'
import { BodyMeasurementHistory, BodyMeasurementId } from '../types/bodyMeasurements'
import {
  BODY_MEASUREMENTS_REPORT_IDS,
  BodyMeasurementReadingPoint,
  BodyMeasurementsReportSummary,
  BodyMeasurementSeriesReport,
  BodyMeasurementTrendBucket,
  BodyMeasurementTrendDirection,
  BodyMeasurementTrendSummary,
} from '../types/bodyMeasurementsReport'
import { MetricDataPoint, PeriodSelection, ProfileSnapshot } from '../types/metrics'
import {
  BODY_MEASUREMENT_CONFIGS,
  formatBodyMeasurementValue,
  getBodyMeasurementConfig,
} from './bodyMeasurements'
import { formatPeriodLabel, parseDateKey } from './metricsPeriod'

function average(values: number[]) {
  if (values.length === 0) return 0
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
}

function formatDayBucketLabel(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function buildTrendBuckets(points: MetricDataPoint[]): BodyMeasurementTrendBucket[] {
  return [...points]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((point) => ({
      label: formatDayBucketLabel(point.date),
      avg: point.value,
      count: 1,
    }))
}

function resolveTrendDirection(buckets: BodyMeasurementTrendBucket[]): BodyMeasurementTrendSummary {
  if (buckets.length < 2) {
    return { buckets, direction: 'stable', changePct: 0 }
  }

  const first = buckets[0].avg
  const last = buckets[buckets.length - 1].avg
  if (first === 0) {
    return { buckets, direction: 'stable', changePct: 0 }
  }

  const changePct = Math.round(((last - first) / first) * 100)
  if (Math.abs(changePct) < 3) {
    return { buckets, direction: 'stable', changePct }
  }

  return {
    buckets,
    direction: changePct > 0 ? 'up' : 'down',
    changePct,
  }
}

function formatSignedDelta(value: number, decimals: number) {
  const formatted = Math.abs(value).toFixed(decimals).replace('.', ',')
  if (value > 0) return `+${formatted}`
  if (value < 0) return `−${formatted}`
  return formatted
}

function buildDeltaLabel(id: BodyMeasurementId, delta: number | null) {
  if (delta === null) return 'Sem variacao no periodo'
  if (Math.abs(delta) < 0.05) return 'Estavel no periodo'

  if (id === 'cintura_quadril') {
    return `${formatSignedDelta(delta, 2)} no indice`
  }

  const config = getBodyMeasurementConfig(id)
  const decimals = config.step < 1 ? 1 : 0
  const unit = id === 'peso' ? 'kg' : config.unit === 'cm' ? 'cm' : ''
  return `${formatSignedDelta(delta, decimals)}${unit ? ` ${unit}` : ''} na ${config.shortLabel}`
}

function buildSeriesReport(
  id: BodyMeasurementId,
  history: BodyMeasurementHistory,
  weightHistory: MetricDataPoint[],
  profile: ProfileSnapshot,
  period: PeriodSelection,
  overrides?: Partial<Record<BodyMeasurementId, number>>,
): BodyMeasurementSeriesReport | null {
  const points = getBodyMeasurementSeriesForPeriod(
    id,
    history,
    weightHistory,
    profile,
    period,
    overrides,
  )
  if (points.length === 0) return null

  const config = getBodyMeasurementConfig(id)
  const values = points.map((point) => point.value)
  const start = points[0]?.value ?? null
  const end = points[points.length - 1]?.value ?? null
  const delta = start !== null && end !== null ? Number((end - start).toFixed(2)) : null
  const readings: BodyMeasurementReadingPoint[] = points.map((point) => ({
    date: point.date,
    value: point.value,
  }))

  return {
    id,
    label: config.label,
    shortLabel: config.shortLabel,
    unit: config.unit,
    group: config.group,
    count: points.length,
    start,
    end,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: average(values),
    delta,
    deltaLabel: buildDeltaLabel(id, delta),
    trend: resolveTrendDirection(buildTrendBuckets(points)),
    readings,
  }
}

function buildHighlights(series: BodyMeasurementSeriesReport[]) {
  const highlights: string[] = []

  series.forEach((entry) => {
    if (entry.delta === null || Math.abs(entry.delta) < 0.05) return

    const formattedStart = entry.start !== null ? formatBodyMeasurementValue(entry.id, entry.start) : '—'
    const formattedEnd = entry.end !== null ? formatBodyMeasurementValue(entry.id, entry.end) : '—'
    highlights.push(
      `${entry.label}: ${formattedStart} → ${formattedEnd} (${entry.deltaLabel})`,
    )
  })

  return highlights.slice(0, 6)
}

function resolveMostChanged(series: BodyMeasurementSeriesReport[]) {
  return (
    series
      .filter((entry) => entry.delta !== null && Math.abs(entry.delta) >= 0.05)
      .sort((left, right) => Math.abs(right.delta ?? 0) - Math.abs(left.delta ?? 0))[0] ?? null
  )
}

export function getBodyMeasurementTrendDirectionLabel(direction: BodyMeasurementTrendDirection) {
  if (direction === 'up') return 'Em alta'
  if (direction === 'down') return 'Em queda'
  return 'Estavel'
}

export function formatBodyMeasurementReportValue(id: BodyMeasurementId, value: number | null) {
  if (value === null) return '—'
  return formatBodyMeasurementValue(id, value)
}

export function buildBodyMeasurementsReport(
  bodyMeasurementHistory: BodyMeasurementHistory,
  weightHistory: MetricDataPoint[],
  profile: ProfileSnapshot,
  period: PeriodSelection,
  overrides?: Partial<Record<BodyMeasurementId, number>>,
): BodyMeasurementsReportSummary {
  const measurementSeries = BODY_MEASUREMENTS_REPORT_IDS.map((id) =>
    buildSeriesReport(id, bodyMeasurementHistory, weightHistory, profile, period, overrides),
  ).filter((entry): entry is BodyMeasurementSeriesReport => entry !== null)

  const waistHipRatio = buildSeriesReport(
    'cintura_quadril',
    bodyMeasurementHistory,
    weightHistory,
    profile,
    period,
    overrides,
  )

  const principal = measurementSeries.filter((entry) => entry.group === 'principal')
  const complementar = measurementSeries.filter((entry) => entry.group === 'complementar')
  const totalReadings = measurementSeries.reduce((sum, entry) => sum + entry.count, 0)

  return {
    periodLabel: formatPeriodLabel(period),
    periodStart: period.start,
    periodEnd: period.end,
    totalReadings,
    trackedMeasurementCount: measurementSeries.length,
    principal,
    complementar,
    waistHipRatio,
    highlights: buildHighlights(measurementSeries),
    mostChanged: resolveMostChanged(measurementSeries),
    allSeries: measurementSeries,
  }
}

export function getBodyMeasurementsReportAccent(id: BodyMeasurementId) {
  const accents: Partial<Record<BodyMeasurementId, string>> = {
    abdomen: '#f97316',
    quadril: '#d946ef',
    peito: '#818cf8',
    cintura: '#fbbf24',
    coxa: '#34d399',
    braco: '#60a5fa',
    pescoco: '#a78bfa',
    cintura_quadril: '#f472b6',
  }
  return accents[id] ?? '#d946ef'
}

export function getBodyMeasurementsOrderedConfigs() {
  return BODY_MEASUREMENT_CONFIGS.filter(
    (config) => config.id !== 'peso' && config.id !== 'cintura_quadril',
  )
}

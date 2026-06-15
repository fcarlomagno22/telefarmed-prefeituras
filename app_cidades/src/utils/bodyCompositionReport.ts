import { getBodyMeasurementSeriesForPeriod } from '../data/bodyMeasurements'
import { getWeightSeriesForPeriod } from '../data/mockHealthMetrics'
import { BodyMeasurementHistory, BodyMeasurementId } from '../types/bodyMeasurements'
import {
  AbdomenReading,
  BodyCompositionReportSummary,
  CompositionTrendBucket,
  CompositionTrendDirection,
  CompositionTrendSummary,
  ImcReading,
  WeightReading,
} from '../types/bodyComposition'
import { MetricDataPoint, PeriodSelection, ProfileSnapshot } from '../types/metrics'
import {
  getAbdominalCircumferenceZoneCopy,
  getAbdominalHighRiskFromCm,
  getAbdominalIdealMaxCm,
} from './abdominalCircumference'
import {
  calculateImc,
  formatImcValue,
  getImcZone,
  hasImcInputs,
  parseHeightMeters,
} from './bmi'
import { formatPeriodLabel, parseDateKey } from './metricsPeriod'

function average(values: number[]) {
  if (values.length === 0) return 0
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
}

function formatDayBucketLabel(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function sortByDate<T extends { date: string }>(points: T[]) {
  return [...points].sort((left, right) => left.date.localeCompare(right.date))
}

function buildTrendBuckets(points: MetricDataPoint[]): CompositionTrendBucket[] {
  return sortByDate(points).map((point) => ({
    label: formatDayBucketLabel(point.date),
    avg: point.value,
    count: 1,
  }))
}

function resolveTrendDirection(buckets: CompositionTrendBucket[]): CompositionTrendSummary {
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

function formatWeightDeltaLabel(deltaKg: number | null) {
  if (deltaKg === null) return 'Sem variacao no periodo'
  if (Math.abs(deltaKg) < 0.05) return 'Peso estavel'

  const formatted = Math.abs(deltaKg).toFixed(1).replace('.', ',')
  return deltaKg < 0 ? `Perdeu ${formatted} kg` : `Ganhou ${formatted} kg`
}

function getAbdominalZoneMeta(valueCm: number, gender: string) {
  const copy = getAbdominalCircumferenceZoneCopy(valueCm, gender)
  const color =
    copy.label === 'Dentro do ideal'
      ? '#34d399'
      : copy.label === 'Acima do ideal'
        ? '#fbbf24'
        : '#f87171'

  return { ...copy, color }
}

function buildImcReadings(weightPoints: MetricDataPoint[], heightM: number): ImcReading[] {
  return sortByDate(weightPoints).map((point) => {
    const imc = Number((point.value / (heightM * heightM)).toFixed(1))
    const zone = getImcZone(imc)
    return {
      date: point.date,
      value: imc,
      zoneLabel: zone.label,
      zoneColor: zone.color,
    }
  })
}

function buildAbdomenReadings(points: MetricDataPoint[], gender: string): AbdomenReading[] {
  return sortByDate(points).map((point) => {
    const zone = getAbdominalZoneMeta(point.value, gender)
    return {
      date: point.date,
      valueCm: point.value,
      zoneLabel: zone.label,
      zoneColor: zone.color,
      zoneHint: zone.hint,
    }
  })
}

export function buildBodyCompositionReport(
  profile: ProfileSnapshot,
  weightHistory: MetricDataPoint[],
  bodyMeasurementHistory: BodyMeasurementHistory,
  period: PeriodSelection,
  abdomenOverride?: number | null,
): BodyCompositionReportSummary {
  const overrides =
    abdomenOverride !== undefined && abdomenOverride !== null
      ? ({ abdomen: abdomenOverride } as Partial<Record<BodyMeasurementId, number>>)
      : undefined

  const weightPoints = getWeightSeriesForPeriod(weightHistory, period, profile)
  const abdomenPoints = getBodyMeasurementSeriesForPeriod(
    'abdomen',
    bodyMeasurementHistory,
    weightHistory,
    profile,
    period,
    overrides,
  )

  const weightReadings: WeightReading[] = sortByDate(weightPoints).map((point) => ({
    date: point.date,
    valueKg: point.value,
  }))

  const weightValues = weightReadings.map((reading) => reading.valueKg)
  const weightTrend = resolveTrendDirection(buildTrendBuckets(weightPoints))
  const startKg = weightReadings[0]?.valueKg ?? null
  const endKg = weightReadings[weightReadings.length - 1]?.valueKg ?? null
  const deltaKg =
    startKg !== null && endKg !== null ? Number((endKg - startKg).toFixed(1)) : null

  const heightM = parseHeightMeters(profile.height)
  const currentImc = calculateImc(profile)
  const currentZone = currentImc !== null ? getImcZone(currentImc) : null
  const imcReadings =
    heightM !== null && weightPoints.length > 0 ? buildImcReadings(weightPoints, heightM) : []
  const imcTrendBase = resolveTrendDirection(
    buildTrendBuckets(
      imcReadings.map((reading) => ({ date: reading.date, value: reading.value })),
    ),
  )
  const imcFirst = imcReadings[0]?.value ?? 0
  const imcLast = imcReadings[imcReadings.length - 1]?.value ?? 0
  const imcChangeAbs =
    imcReadings.length >= 2 ? Number((imcLast - imcFirst).toFixed(1)) : 0

  const idealMaxCm = getAbdominalIdealMaxCm(profile.gender)
  const highRiskFromCm = getAbdominalHighRiskFromCm(profile.gender)
  const abdomenReadings = buildAbdomenReadings(abdomenPoints, profile.gender)
  const abdomenValues = abdomenReadings.map((reading) => reading.valueCm)
  const abdomenTrend = resolveTrendDirection(buildTrendBuckets(abdomenPoints))
  const aboveIdealCount = abdomenReadings.filter((reading) => reading.valueCm > idealMaxCm).length
  const elevatedRiskCount = abdomenReadings.filter(
    (reading) => reading.valueCm >= highRiskFromCm,
  ).length

  return {
    periodLabel: formatPeriodLabel(period),
    periodStart: period.start,
    periodEnd: period.end,
    profile: {
      height: profile.height,
      weight: profile.weight,
      gender: profile.gender,
    },
    imc: {
      current: currentImc,
      zone: currentZone
        ? {
            label: currentZone.label,
            rangeLabel: currentZone.rangeLabel,
            color: currentZone.color,
          }
        : null,
      trend: {
        ...imcTrendBase,
        changeAbs: imcChangeAbs,
      },
      readings: imcReadings,
    },
    weight: {
      min: weightValues.length > 0 ? Math.min(...weightValues) : 0,
      max: weightValues.length > 0 ? Math.max(...weightValues) : 0,
      avg: average(weightValues),
      startKg,
      endKg,
      deltaKg,
      deltaLabel: formatWeightDeltaLabel(deltaKg),
      trend: weightTrend,
      readings: weightReadings,
    },
    abdomen: {
      min: abdomenValues.length > 0 ? Math.min(...abdomenValues) : 0,
      max: abdomenValues.length > 0 ? Math.max(...abdomenValues) : 0,
      avg: average(abdomenValues),
      idealMaxCm,
      highRiskFromCm,
      aboveIdealPct:
        abdomenReadings.length > 0
          ? Math.round((aboveIdealCount / abdomenReadings.length) * 100)
          : 0,
      elevatedRiskCount,
      trend: abdomenTrend,
      readings: abdomenReadings,
    },
    totalDataPoints: weightReadings.length + abdomenReadings.length,
  }
}

export function getCompositionTrendDirectionLabel(direction: CompositionTrendDirection) {
  if (direction === 'up') return 'Em ascensao'
  if (direction === 'down') return 'Em queda'
  return 'Estavel'
}

export function formatCompositionDate(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatWeightKg(value: number) {
  return `${value.toFixed(1).replace('.', ',')} kg`
}

export function formatCircumferenceCm(value: number) {
  return `${Math.round(value)} cm`
}

export { formatImcValue, hasImcInputs }

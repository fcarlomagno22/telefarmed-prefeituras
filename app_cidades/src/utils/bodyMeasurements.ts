import { formatDateKey } from './metricsPeriod'
import {
  BodyMeasurementConfig,
  BodyMeasurementId,
  StorableBodyMeasurementId,
} from '../types/bodyMeasurements'
import { MetricDataPoint } from '../types/metrics'

export const BODY_MEASUREMENT_CONFIGS: BodyMeasurementConfig[] = [
  {
    id: 'peso',
    label: 'Peso',
    shortLabel: 'peso',
    unit: 'kg',
    icon: 'weight-kilogram',
    group: 'principal',
    min: 30,
    max: 250,
    step: 0.1,
    defaultValue: 78,
    loggable: true,
  },
  {
    id: 'abdomen',
    label: 'Circunferência abdominal',
    shortLabel: 'abdômen',
    unit: 'cm',
    icon: 'human',
    group: 'principal',
    min: 50,
    max: 150,
    step: 1,
    defaultValue: 88,
    loggable: true,
  },
  {
    id: 'quadril',
    label: 'Circunferência do quadril',
    shortLabel: 'quadril',
    unit: 'cm',
    icon: 'human-female',
    group: 'principal',
    min: 60,
    max: 160,
    step: 1,
    defaultValue: 98,
    loggable: true,
  },
  {
    id: 'cintura_quadril',
    label: 'Relação cintura/quadril',
    shortLabel: 'cintura/quadril',
    unit: 'índice',
    icon: 'percent-outline',
    group: 'principal',
    min: 0.5,
    max: 1.5,
    step: 0.01,
    defaultValue: 0.86,
    computed: true,
    loggable: false,
  },
  {
    id: 'peito',
    label: 'Peito / tórax',
    shortLabel: 'peito',
    unit: 'cm',
    icon: 'human-handsup',
    group: 'complementar',
    min: 60,
    max: 150,
    step: 1,
    defaultValue: 92,
    loggable: true,
  },
  {
    id: 'cintura',
    label: 'Cintura',
    shortLabel: 'cintura',
    unit: 'cm',
    icon: 'tape-measure',
    group: 'complementar',
    min: 50,
    max: 140,
    step: 1,
    defaultValue: 84,
    loggable: true,
  },
  {
    id: 'coxa',
    label: 'Coxa',
    shortLabel: 'coxa',
    unit: 'cm',
    icon: 'walk',
    group: 'complementar',
    min: 35,
    max: 90,
    step: 1,
    defaultValue: 56,
    loggable: true,
  },
  {
    id: 'braco',
    label: 'Braço (relaxado)',
    shortLabel: 'braço',
    unit: 'cm',
    icon: 'arm-flex',
    group: 'complementar',
    min: 20,
    max: 55,
    step: 0.5,
    defaultValue: 30,
    loggable: true,
  },
  {
    id: 'pescoco',
    label: 'Pescoço',
    shortLabel: 'pescoço',
    unit: 'cm',
    icon: 'account',
    group: 'complementar',
    min: 28,
    max: 55,
    step: 0.5,
    defaultValue: 36,
    loggable: true,
  },
]

export function getBodyMeasurementConfig(id: BodyMeasurementId) {
  return BODY_MEASUREMENT_CONFIGS.find((item) => item.id === id) ?? BODY_MEASUREMENT_CONFIGS[0]
}

export function formatBodyMeasurementValue(id: BodyMeasurementId, value: number) {
  const config = getBodyMeasurementConfig(id)

  if (id === 'peso') {
    return `${value.toFixed(1).replace('.', ',')} kg`
  }

  if (id === 'cintura_quadril') {
    return value.toFixed(2).replace('.', ',')
  }

  if (config.unit === 'cm') {
    return `${Math.round(value)} cm`
  }

  return String(value)
}

export function calculateWaistHipRatio(waistCm: number, hipCm: number) {
  if (hipCm <= 0) return null
  return Number((waistCm / hipCm).toFixed(2))
}

function sortSeries(points: MetricDataPoint[]) {
  return [...points].sort((left, right) => left.date.localeCompare(right.date))
}

function findBaselinePoint(series: MetricDataPoint[], daysBack = 30) {
  if (series.length === 0) return null

  const target = new Date()
  target.setDate(target.getDate() - daysBack)
  const targetKey = formatDateKey(target)

  let baseline = series[0]
  for (const point of series) {
    if (point.date <= targetKey) {
      baseline = point
    } else {
      break
    }
  }

  return baseline
}

function formatSignedDelta(value: number, decimals: number) {
  const formatted = Math.abs(value).toFixed(decimals).replace('.', ',')
  if (value > 0) return `+${formatted}`
  if (value < 0) return `−${formatted}`
  return formatted
}

export function getMeasurementDeltaSummary(id: BodyMeasurementId, series: MetricDataPoint[]) {
  if (series.length < 2) return null

  const latest = series[series.length - 1]?.value
  const baseline = findBaselinePoint(series)?.value
  if (latest === undefined || baseline === undefined) return null

  const delta = latest - baseline
  if (Math.abs(delta) < 0.05) {
    return `Sem mudança relevante na ${getBodyMeasurementConfig(id).shortLabel} nos últimos 30 dias`
  }

  if (id === 'peso') {
    return `${formatSignedDelta(delta, 1)} kg no mês`
  }

  if (id === 'cintura_quadril') {
    return `${formatSignedDelta(delta, 2)} na relação cintura/quadril nos últimos 30 dias`
  }

  const cmDelta = Math.round(delta)
  if (cmDelta === 0) {
    return `Sem mudança relevante na ${getBodyMeasurementConfig(id).shortLabel} nos últimos 30 dias`
  }

  return `${formatSignedDelta(cmDelta, 0)} cm na ${getBodyMeasurementConfig(id).shortLabel} nos últimos 30 dias`
}

export function buildWaistHipRatioSeries(
  waistSeries: MetricDataPoint[],
  hipSeries: MetricDataPoint[],
): MetricDataPoint[] {
  const hipByDate = new Map(hipSeries.map((point) => [point.date, point.value]))
  const dates = new Set([...waistSeries.map((point) => point.date), ...hipSeries.map((point) => point.date)])

  const points = [...dates]
    .sort()
    .map((date) => {
      const waist =
        waistSeries.find((point) => point.date === date)?.value ??
        [...waistSeries].reverse().find((point) => point.date <= date)?.value
      const hip =
        hipByDate.get(date) ??
        [...hipSeries].reverse().find((point) => point.date <= date)?.value

      if (waist === undefined || hip === undefined) return null

      const ratio = calculateWaistHipRatio(waist, hip)
      if (ratio === null) return null

      return { date, value: ratio }
    })
    .filter((point): point is MetricDataPoint => point !== null)

  return sortSeries(points)
}

export function isStorableBodyMeasurementId(id: BodyMeasurementId): id is StorableBodyMeasurementId {
  return id !== 'peso' && id !== 'cintura_quadril'
}

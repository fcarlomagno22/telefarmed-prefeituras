import { ChartableMetricId, MetricDataPoint, PeriodSelection } from '../types/metrics'
import { formatBloodPressureShort } from './bloodPressure'
import { calculateImc, parseWeightKg } from './bmi'
import { formatDateKey, isHourlyPeriod } from './metricsPeriod'

function formatMetricNumber(metricId: ChartableMetricId, raw: number) {
  const decimals =
    metricId === 'distancia' || metricId === 'hidratacao' || metricId === 'peso' ? 1 : 0
  return Number(Math.max(0, raw).toFixed(decimals))
}

export function formatWeightNumber(raw: number) {
  return formatMetricNumber('peso', raw)
}

export function formatMetricValue(
  metricId: ChartableMetricId,
  value: number,
  options?: { diastolic?: number },
) {
  if (metricId === 'pressao') return formatBloodPressureShort(value, options?.diastolic ?? 0)
  if (metricId === 'distancia') return `${value.toFixed(1)} km`
  if (metricId === 'passos') return Math.round(value).toLocaleString('pt-BR')
  if (metricId === 'imc') return value.toFixed(1)
  if (metricId === 'corporais') return `${value.toFixed(1)}%`
  if (metricId === 'glicemia') return `${Math.round(value)} mg/dL`
  if (metricId === 'frequencia') return `${Math.round(value)} bpm`
  if (metricId === 'hidratacao') return `${value.toFixed(1).replace('.', ',')} L`
  if (metricId === 'peso') return `${value.toFixed(1).replace('.', ',')} kg`
  if (metricId === 'circunferencia') return `${Math.round(value)} CM`
  return String(value)
}

export function getMetricPointKey(point: MetricDataPoint) {
  return point.hour !== undefined ? `${point.date}T${String(point.hour).padStart(2, '0')}` : point.date
}

export function getMetricCardNumericValue(
  metricId: ChartableMetricId,
  profile: { height: string; weight: string },
  latest: {
    imc: number | null
    pesoKg: number | null
    glicemiaMgDl: number | null
    pressaoSistolica: number | null
    frequenciaBpm: number | null
    passosHoje: number | null
    distanciaKmHoje: number | null
    hidratacaoMlHoje: number | null
    circunferenciaAbdomenCm: number | null
  } | null,
): number | undefined {
  if (metricId === 'imc') {
    return latest?.imc ?? calculateImc(profile) ?? undefined
  }
  if (metricId === 'peso') {
    return latest?.pesoKg ?? parseWeightKg(profile.weight) ?? undefined
  }
  if (metricId === 'glicemia') return latest?.glicemiaMgDl ?? undefined
  if (metricId === 'pressao') return latest?.pressaoSistolica ?? undefined
  if (metricId === 'frequencia') return latest?.frequenciaBpm ?? undefined
  if (metricId === 'passos') return latest?.passosHoje ?? undefined
  if (metricId === 'distancia') return latest?.distanciaKmHoje ?? undefined
  if (metricId === 'hidratacao') {
    return latest?.hidratacaoMlHoje != null ? latest.hidratacaoMlHoje / 1000 : undefined
  }
  if (metricId === 'circunferencia') return latest?.circunferenciaAbdomenCm ?? undefined
  return undefined
}

export function createLiveRegistrationPoint(
  metricId: ChartableMetricId,
  value: number,
  period: PeriodSelection,
  at: Date = new Date(),
  options?: { diastolic?: number },
): MetricDataPoint {
  const point: MetricDataPoint = {
    date: formatDateKey(at),
    value: formatMetricNumber(metricId, value),
  }

  if (metricId === 'pressao' && options?.diastolic !== undefined) {
    point.diastolic = formatMetricNumber(metricId, options.diastolic)
  }

  if (isHourlyPeriod(period)) {
    point.hour = at.getHours()
  }

  return point
}

/** Aplica registros manuais deslizando a janela — novo ponto entra pela direita. */
export function applyLiveRegistrationSliding(
  base: MetricDataPoint[],
  registrations: MetricDataPoint[],
): MetricDataPoint[] {
  if (registrations.length === 0 || base.length === 0) return base

  let series = [...base]

  for (const registration of registrations) {
    const lastIndex = series.length - 1
    const last = series[lastIndex]
    const sameSlot =
      last.date === registration.date &&
      (registration.hour === undefined || last.hour === registration.hour)

    if (sameSlot) {
      series[lastIndex] = { ...registration }
      continue
    }

    series = series.length >= 2 ? [...series.slice(1), registration] : [...series, registration]
  }

  return series
}

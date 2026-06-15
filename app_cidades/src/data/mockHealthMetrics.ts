import { ChartableMetricId, MetricDataPoint, PeriodSelection, ProfileSnapshot } from '../types/metrics'
import { calculateImc, parseWeightKg } from '../utils/bmi'
import { filterSeriesByPeriod, formatDateKey, isHourlyPeriod, isTodayPeriod } from '../utils/metricsPeriod'

export const PROFILE_SNAPSHOT: ProfileSnapshot = {
  height: '1,72 m',
  weight: '78 kg',
  age: '34 anos',
  gender: 'Feminino',
}

const METRIC_BASE_VALUES: Record<ChartableMetricId, number> = {
  imc: 24.6,
  peso: 78,
  glicemia: 92,
  pressao: 118,
  frequencia: 72,
  passos: 6840,
  distancia: 4.2,
  corporais: 22.4,
  hidratacao: 2.1,
  circunferencia: 88,
}

const METRIC_VARIANCE: Record<ChartableMetricId, number> = {
  imc: 1.2,
  peso: 2.8,
  glicemia: 18,
  pressao: 14,
  frequencia: 12,
  passos: 3200,
  distancia: 2.4,
  corporais: 3.5,
  hidratacao: 0.9,
  circunferencia: 4.5,
}

function seededNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function generateDiastolicFromSystolic(systolic: number, seed: number) {
  const noise = (seededNoise(seed) - 0.5) * 6
  const base = Math.round(systolic * 0.62 + 8)
  return Math.min(90, Math.max(55, base + Math.round(noise)))
}

export function deriveDiastolicFromSystolic(systolic: number) {
  return generateDiastolicFromSystolic(systolic, Math.round(systolic))
}

export function formatBloodPressureValue(systolic: number, diastolic?: number) {
  const resolvedDiastolic = diastolic ?? deriveDiastolicFromSystolic(systolic)
  return `${Math.round(systolic)}/${Math.round(resolvedDiastolic)}`
}

function formatMetricNumber(metricId: ChartableMetricId, raw: number) {
  const decimals =
    metricId === 'distancia' || metricId === 'hidratacao' || metricId === 'peso' ? 1 : 0
  return Number(Math.max(0, raw).toFixed(decimals))
}

export function formatWeightNumber(raw: number) {
  return formatMetricNumber('peso', raw)
}

function getMetricBaseValue(metricId: ChartableMetricId, profile?: ProfileSnapshot) {
  if (metricId === 'imc' && profile) {
    return calculateImc(profile) ?? METRIC_BASE_VALUES.imc
  }
  if (metricId === 'peso' && profile) {
    return parseWeightKg(profile.weight) ?? METRIC_BASE_VALUES.peso
  }
  return METRIC_BASE_VALUES[metricId]
}

function generateWeightDailySeries(days: number, profile?: ProfileSnapshot): MetricDataPoint[] {
  if (profile) return createInitialWeightHistory(profile)
  const current = getMetricBaseValue('peso', profile)
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  return [
    {
      date: formatDateKey(today),
      value: formatMetricNumber('peso', current),
    },
  ]
}

function generateWeightHourlySeries(
  day: Date,
  capAtCurrentHour: boolean,
  profile?: ProfileSnapshot,
): MetricDataPoint[] {
  if (profile) return createInitialWeightHistory(profile)
  const current = getMetricBaseValue('peso', profile)
  const dateKey = formatDateKey(day)
  const hour = capAtCurrentHour ? new Date().getHours() : 12

  return [
    {
      date: dateKey,
      hour,
      value: formatMetricNumber('peso', current),
    },
  ]
}

function sortWeightHistory(points: MetricDataPoint[]) {
  return [...points].sort((left, right) => {
    if (left.date !== right.date) return left.date.localeCompare(right.date)
    return (left.hour ?? 0) - (right.hour ?? 0)
  })
}

export const WEIGHT_HISTORY_DAYS = 7

/** Últimos 7 dias com tendência suave até o peso atual do perfil. */
export function createInitialWeightHistory(
  profile: ProfileSnapshot,
  at: Date = new Date(),
): MetricDataPoint[] {
  const current = parseWeightKg(profile.weight)
  if (current === null) return []

  const today = new Date(at)
  today.setHours(12, 0, 0, 0)
  const startOffset = 1.8

  return Array.from({ length: WEIGHT_HISTORY_DAYS }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (WEIGHT_HISTORY_DAYS - 1 - index))
    const progress = WEIGHT_HISTORY_DAYS <= 1 ? 1 : index / (WEIGHT_HISTORY_DAYS - 1)
    const value = current + startOffset * (1 - progress)

    return {
      date: formatDateKey(date),
      value: formatMetricNumber('peso', value),
    }
  })
}

/** Garante os últimos 7 dias; registros reais substituem o seed do dia. */
export function ensureSevenDayWeightHistory(
  history: MetricDataPoint[],
  profile: ProfileSnapshot,
): MetricDataPoint[] {
  const seed = createInitialWeightHistory(profile)
  const byDate = new Map(seed.map((point) => [point.date, point]))

  for (const entry of history) {
    byDate.set(entry.date, { date: entry.date, value: entry.value })
  }

  const today = formatDateKey(new Date())
  if (!byDate.has(today)) {
    const current = parseWeightKg(profile.weight)
    if (current !== null) {
      byDate.set(today, { date: today, value: formatMetricNumber('peso', current) })
    }
  }

  return sortWeightHistory([...byDate.values()])
}

/** Adiciona ou atualiza um registro de peso no histórico. */
export function registerWeightInHistory(
  history: MetricDataPoint[],
  valueKg: number,
  period: PeriodSelection,
  at: Date = new Date(),
): MetricDataPoint[] {
  const point = createLiveRegistrationPoint('peso', valueKg, period, at)
  const next = [...history]
  const dailyPoint: MetricDataPoint = {
    date: point.date,
    value: point.value,
  }
  const existingIndex = next.findIndex((entry) => entry.date === dailyPoint.date)

  if (existingIndex >= 0) {
    next[existingIndex] = dailyPoint
  } else {
    next.push(dailyPoint)
  }

  return sortWeightHistory(next)
}

/** Série diária de peso com seed + registros reais, cobrindo `days` dias. */
export function createExtendedWeightHistory(
  history: MetricDataPoint[],
  profile: ProfileSnapshot,
  days = 60,
): MetricDataPoint[] {
  const current = parseWeightKg(profile.weight)
  if (current === null) return sortWeightHistory(history)

  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const startOffset = 1.8

  const seed = Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - 1 - index))
    const progress = days <= 1 ? 1 : index / (days - 1)
    const value = current + startOffset * (1 - progress)

    return {
      date: formatDateKey(date),
      value: formatMetricNumber('peso', value),
    }
  })

  const byDate = new Map(seed.map((point) => [point.date, point]))
  for (const entry of history) {
    byDate.set(entry.date, { date: entry.date, value: entry.value })
  }

  return sortWeightHistory([...byDate.values()])
}

/** Série de peso filtrada pelo período selecionado. */
export function getWeightSeriesForPeriod(
  history: MetricDataPoint[],
  period: PeriodSelection,
  profile?: ProfileSnapshot,
): MetricDataPoint[] {
  if (!profile) return filterSeriesByPeriod(sortWeightHistory(history), period)
  const extended = createExtendedWeightHistory(history, profile, 90)
  return filterSeriesByPeriod(extended, period)
}

export function generateDailyMetricSeries(
  metricId: ChartableMetricId,
  days = 60,
  profile?: ProfileSnapshot,
): MetricDataPoint[] {
  if (metricId === 'peso') {
    return generateWeightDailySeries(days, profile)
  }

  const base = getMetricBaseValue(metricId, profile)
  const variance = METRIC_VARIANCE[metricId]
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - 1 - index))
    const noise = seededNoise(index + metricId.length * 3) - 0.5
    const wave = Math.sin(index / 4.5) * variance * 0.35
    const trend = (index - days / 2) * (variance * 0.01)
    const raw = base + wave + trend + noise * variance * 0.55
    const value = formatMetricNumber(metricId, raw)

    if (metricId === 'pressao') {
      return {
        date: formatDateKey(date),
        value,
        diastolic: generateDiastolicFromSystolic(value, index + 17),
      }
    }

    return {
      date: formatDateKey(date),
      value,
    }
  })
}

function buildHourSlots(capAtCurrentHour: boolean) {
  const maxHour = capAtCurrentHour ? new Date().getHours() : 23
  const hours: number[] = []

  for (let hour = 0; hour <= maxHour; hour += 1) {
    hours.push(hour)
  }

  if (hours.length < 2) {
    return [Math.max(0, maxHour - 1), maxHour]
  }

  return hours
}

function generateHourlyMetricSeries(
  metricId: ChartableMetricId,
  day: Date,
  capAtCurrentHour: boolean,
  profile?: ProfileSnapshot,
): MetricDataPoint[] {
  if (metricId === 'peso') {
    return generateWeightHourlySeries(day, capAtCurrentHour, profile)
  }

  const base = getMetricBaseValue(metricId, profile)
  const variance = METRIC_VARIANCE[metricId]
  const dateKey = formatDateKey(day)
  const hours = buildHourSlots(capAtCurrentHour)

  return hours.map((hour) => {
    const noise = seededNoise(hour + metricId.length * 7 + day.getDate()) - 0.5
    const wave = Math.sin(hour / 3.5) * variance * 0.28
    const dailyTrend = Math.sin((hour / 24) * Math.PI * 2) * variance * 0.18
    const raw = base + wave + dailyTrend + noise * variance * 0.32
    const value = formatMetricNumber(metricId, raw)

    if (metricId === 'pressao') {
      return {
        date: dateKey,
        hour,
        value,
        diastolic: generateDiastolicFromSystolic(value, hour + day.getDate()),
      }
    }

    return {
      date: dateKey,
      hour,
      value,
    }
  })
}

export function generateMetricSeriesForPeriod(
  metricId: ChartableMetricId,
  period: PeriodSelection,
  profile?: ProfileSnapshot,
): MetricDataPoint[] {
  if (metricId === 'peso' && profile) {
    return ensureSevenDayWeightHistory([], profile)
  }

  if (isHourlyPeriod(period)) {
    return generateHourlyMetricSeries(metricId, period.start, isTodayPeriod(period), profile)
  }

  const daily = generateDailyMetricSeries(metricId, 60, profile)
  return filterSeriesByPeriod(daily, period)
}

/** @deprecated Use generateDailyMetricSeries or generateMetricSeriesForPeriod */
export function generateMetricSeries(metricId: ChartableMetricId, days = 60) {
  return generateDailyMetricSeries(metricId, days)
}

export function getLatestMetricValue(metricId: ChartableMetricId, profile?: ProfileSnapshot) {
  return getLatestMetricPoint(metricId, profile).value
}

export function getLatestMetricPoint(metricId: ChartableMetricId, profile?: ProfileSnapshot): MetricDataPoint {
  if (metricId === 'imc' && profile) {
    const imc = calculateImc(profile)
    if (imc !== null) return { date: formatDateKey(new Date()), value: imc }
  }
  if (metricId === 'peso' && profile) {
    const peso = parseWeightKg(profile.weight)
    if (peso !== null) return { date: formatDateKey(new Date()), value: peso }
  }

  const series = generateDailyMetricSeries(metricId)
  const last = series[series.length - 1]
  if (last) return last

  return {
    date: formatDateKey(new Date()),
    value: METRIC_BASE_VALUES[metricId],
    ...(metricId === 'pressao'
      ? { diastolic: generateDiastolicFromSystolic(METRIC_BASE_VALUES.pressao, 0) }
      : {}),
  }
}

export function formatMetricValue(
  metricId: ChartableMetricId,
  value: number,
  options?: { diastolic?: number },
) {
  if (metricId === 'pressao') return formatBloodPressureValue(value, options?.diastolic)
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

function formatLiveRegistrationValue(metricId: ChartableMetricId, value: number) {
  return formatMetricNumber(metricId, value)
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
    value: formatLiveRegistrationValue(metricId, value),
  }

  if (metricId === 'pressao' && options?.diastolic !== undefined) {
    point.diastolic = formatLiveRegistrationValue(metricId, options.diastolic)
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

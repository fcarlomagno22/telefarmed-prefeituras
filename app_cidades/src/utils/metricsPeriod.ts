import { PeriodPreset, PeriodSelection } from '../types/metrics'

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function startOfWeek(date: Date) {
  const next = startOfDay(date)
  const day = next.getDay()
  const diff = day === 0 ? 6 : day - 1
  next.setDate(next.getDate() - diff)
  return next
}

function startOfMonth(date: Date) {
  const next = startOfDay(date)
  next.setDate(1)
  return next
}

export function buildPeriodSelection(
  preset: PeriodPreset,
  customStart?: Date,
  customEnd?: Date,
): PeriodSelection {
  const today = new Date()

  if (preset === 'today') {
    return { preset, start: startOfDay(today), end: endOfDay(today) }
  }

  if (preset === 'yesterday') {
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    return { preset, start: startOfDay(yesterday), end: endOfDay(yesterday) }
  }

  if (preset === 'week') {
    return { preset, start: startOfWeek(today), end: endOfDay(today) }
  }

  if (preset === 'month') {
    return { preset, start: startOfMonth(today), end: endOfDay(today) }
  }

  if (preset === 'last30days') {
    const start = new Date(today)
    start.setDate(today.getDate() - 29)
    return { preset, start: startOfDay(start), end: endOfDay(today) }
  }

  const start = startOfDay(customStart ?? today)
  const end = endOfDay(customEnd ?? today)
  return {
    preset: 'custom',
    start: start <= end ? start : end,
    end: start <= end ? end : start,
  }
}

export function isHourlyPeriod(period: PeriodSelection) {
  return formatDateKey(period.start) === formatDateKey(period.end)
}

export function isTodayPeriod(period: PeriodSelection) {
  const todayKey = formatDateKey(new Date())
  return formatDateKey(period.start) === todayKey && isHourlyPeriod(period)
}

export function filterSeriesByPeriod<T extends { date: string }>(
  series: T[],
  period: PeriodSelection,
) {
  const startKey = formatDateKey(period.start)
  const endKey = formatDateKey(period.end)
  return series.filter((point) => point.date >= startKey && point.date <= endKey)
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatPeriodLabel(period: PeriodSelection) {
  if (period.preset === 'today') return 'Hoje'
  if (period.preset === 'yesterday') return 'Ontem'
  if (period.preset === 'week') return 'Essa semana'
  if (period.preset === 'month') return 'Este mês'
  if (period.preset === 'last30days') return 'Últimos 30 dias'

  const start = period.start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  const end = period.end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `${start} – ${end}`
}

export function formatChartDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function formatChartHourLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}h`
}

export function formatChartAxisLabel(
  point: { date: string; hour?: number },
  period: PeriodSelection,
  forceDaily = false,
) {
  if (!forceDaily && isHourlyPeriod(period) && point.hour !== undefined) {
    return formatChartHourLabel(point.hour)
  }
  return formatChartDateLabel(point.date)
}

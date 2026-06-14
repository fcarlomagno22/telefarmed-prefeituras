import type { MonitorPeriodRange, TimelinePeriod } from './types.js'

const SP_OFFSET = '-03:00'

function spDateParts(date: Date): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  return {
    year: parts.find((part) => part.type === 'year')?.value ?? '1970',
    month: parts.find((part) => part.type === 'month')?.value ?? '01',
    day: parts.find((part) => part.type === 'day')?.value ?? '01',
  }
}

function spWeekday(date: Date): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
  }).format(date)

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return map[weekday] ?? 1
}

function addDays(parts: { year: string; month: string; day: string }, delta: number) {
  const utc = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00${SP_OFFSET}`)
  utc.setUTCDate(utc.getUTCDate() + delta)
  return spDateParts(utc)
}

function startOfDayIso(parts: { year: string; month: string; day: string }): string {
  return `${parts.year}-${parts.month}-${parts.day}T00:00:00${SP_OFFSET}`
}

function endOfDayIso(parts: { year: string; month: string; day: string }): string {
  return `${parts.year}-${parts.month}-${parts.day}T23:59:59.999${SP_OFFSET}`
}

export function resolveMonitorPeriod(period: TimelinePeriod, now = new Date()): MonitorPeriodRange {
  const today = spDateParts(now)
  const yesterday = addDays(today, -1)
  const dayBeforeYesterday = addDays(today, -2)

  if (period === 'hoje') {
    return {
      startIso: startOfDayIso(today),
      endIso: now.toISOString(),
      previousStartIso: startOfDayIso(yesterday),
      previousEndIso: endOfDayIso(yesterday),
    }
  }

  if (period === 'ontem') {
    return {
      startIso: startOfDayIso(yesterday),
      endIso: endOfDayIso(yesterday),
      previousStartIso: startOfDayIso(dayBeforeYesterday),
      previousEndIso: endOfDayIso(dayBeforeYesterday),
    }
  }

  const weekday = spWeekday(now)
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  const monday = addDays(today, mondayOffset)
  const previousMonday = addDays(monday, -7)
  const previousSunday = addDays(monday, -1)

  return {
    startIso: startOfDayIso(monday),
    endIso: now.toISOString(),
    previousStartIso: startOfDayIso(previousMonday),
    previousEndIso: endOfDayIso(previousSunday),
  }
}

export const TIMELINE_HOUR_BUCKETS = [8, 10, 12, 14, 16, 18] as const

export function formatTimelineHourLabels(): string[] {
  return TIMELINE_HOUR_BUCKETS.map((hour) => `${String(hour).padStart(2, '0')}h`)
}

export function bucketConsultationHour(iso: string | null | undefined): number | null {
  if (!iso) return null

  const hourPart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    hour12: false,
  }).format(new Date(iso))

  const hour = Number.parseInt(hourPart, 10)
  if (!Number.isFinite(hour)) return null

  let bucketIndex = -1
  for (let index = TIMELINE_HOUR_BUCKETS.length - 1; index >= 0; index -= 1) {
    if (hour >= TIMELINE_HOUR_BUCKETS[index]!) {
      bucketIndex = index
      break
    }
  }

  return bucketIndex >= 0 ? bucketIndex : null
}

export const TIMELINE_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6']

export const TIMELINE_PERIOD_OPTIONS = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: 'semana', label: 'Esta semana' },
] as const

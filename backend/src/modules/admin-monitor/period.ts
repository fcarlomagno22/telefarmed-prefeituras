import type { AdminMonitorTimelinePeriod } from './types.js'

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

export type AdminMonitorPeriodRange = {
  startIso: string
  endIso: string
  previousStartIso: string
  previousEndIso: string
}

export function resolveAdminMonitorPeriod(
  period: AdminMonitorTimelinePeriod,
  now = new Date(),
): AdminMonitorPeriodRange {
  const today = spDateParts(now)
  const yesterday = addDays(today, -1)

  if (period === '24h') {
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const previousStart = new Date(start.getTime() - 24 * 60 * 60 * 1000)
    return {
      startIso: start.toISOString(),
      endIso: now.toISOString(),
      previousStartIso: previousStart.toISOString(),
      previousEndIso: start.toISOString(),
    }
  }

  if (period === '7d' || period === 'semana') {
    const weekStart = addDays(today, -6)
    const previousWeekStart = addDays(weekStart, -7)
    const previousWeekEnd = addDays(weekStart, -1)
    return {
      startIso: startOfDayIso(weekStart),
      endIso: now.toISOString(),
      previousStartIso: startOfDayIso(previousWeekStart),
      previousEndIso: endOfDayIso(previousWeekEnd),
    }
  }

  if (period === 'ontem') {
    const dayBefore = addDays(today, -2)
    return {
      startIso: startOfDayIso(yesterday),
      endIso: endOfDayIso(yesterday),
      previousStartIso: startOfDayIso(dayBefore),
      previousEndIso: endOfDayIso(dayBefore),
    }
  }

  // dia | hoje — janela do dia corrente (America/Sao_Paulo)
  return {
    startIso: startOfDayIso(today),
    endIso: now.toISOString(),
    previousStartIso: startOfDayIso(yesterday),
    previousEndIso: endOfDayIso(yesterday),
  }
}

export const TIMELINE_SLOT_HOURS = [0, 3, 6, 9, 12, 15, 18, 21] as const

export function bucketTimelineHour(iso: string | null | undefined): number | null {
  if (!iso) return null

  const hourPart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    hour12: false,
  }).format(new Date(iso))

  const hour = Number.parseInt(hourPart, 10)
  if (!Number.isFinite(hour)) return null

  let bucketIndex = -1
  for (let index = TIMELINE_SLOT_HOURS.length - 1; index >= 0; index -= 1) {
    if (hour >= TIMELINE_SLOT_HOURS[index]!) {
      bucketIndex = index
      break
    }
  }

  return bucketIndex >= 0 ? bucketIndex : null
}

export function formatTimeAgo(iso: string | null | undefined): string {
  if (!iso) return 'agora'
  const minutes = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000))
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return hours === 1 ? 'há 1 h' : `há ${hours} h`
}

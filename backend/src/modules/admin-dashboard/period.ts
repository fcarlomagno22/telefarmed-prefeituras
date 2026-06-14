import type { AdminDashboardPeriod, AdminDashboardPeriodRange } from './types.js'

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

export function resolveAdminDashboardPeriod(
  period: AdminDashboardPeriod,
  now = new Date(),
): AdminDashboardPeriodRange {
  const today = spDateParts(now)

  if (period === '30d') {
    const start = addDays(today, -29)
    return {
      startIso: startOfDayIso(start),
      endIso: now.toISOString(),
      dayCount: 30,
    }
  }

  if (period === '7d') {
    const start = addDays(today, -6)
    return {
      startIso: startOfDayIso(start),
      endIso: now.toISOString(),
      dayCount: 7,
    }
  }

  return {
    startIso: startOfDayIso(today),
    endIso: now.toISOString(),
    dayCount: 1,
  }
}

export const DASHBOARD_HOURLY_SLOTS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] as const

export function bucketDashboardHour(iso: string | null | undefined): number | null {
  if (!iso) return null

  const hourPart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    hour12: false,
  }).format(new Date(iso))

  const hour = Number.parseInt(hourPart, 10)
  if (!Number.isFinite(hour)) return null
  if (!DASHBOARD_HOURLY_SLOTS.includes(hour as (typeof DASHBOARD_HOURLY_SLOTS)[number])) return null
  return hour
}

export function formatDashboardHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}h`
}

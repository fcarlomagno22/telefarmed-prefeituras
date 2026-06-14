import type { DashboardPeriod, DashboardPeriodRange } from './types.js'

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

function toIsoDate(parts: { year: string; month: string; day: string }): string {
  return `${parts.year}-${parts.month}-${parts.day}`
}

function startOfDayIso(parts: { year: string; month: string; day: string }): string {
  return `${parts.year}-${parts.month}-${parts.day}T00:00:00${SP_OFFSET}`
}

export function resolveDashboardPeriod(period: DashboardPeriod, now = new Date()): DashboardPeriodRange {
  const today = spDateParts(now)

  if (period === 'hoje') {
    return {
      periodStart: toIsoDate(today),
      periodEnd: toIsoDate(today),
      startIso: startOfDayIso(today),
      endIso: now.toISOString(),
    }
  }

  if (period === '7d') {
    const start = addDays(today, -6)
    return {
      periodStart: toIsoDate(start),
      periodEnd: toIsoDate(today),
      startIso: startOfDayIso(start),
      endIso: now.toISOString(),
    }
  }

  const start = addDays(today, -29)
  return {
    periodStart: toIsoDate(start),
    periodEnd: toIsoDate(today),
    startIso: startOfDayIso(start),
    endIso: now.toISOString(),
  }
}

export const DASHBOARD_PERIOD_OPTIONS = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
] as const

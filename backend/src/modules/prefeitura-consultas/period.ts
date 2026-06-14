export function periodBounds(periodStart: string, periodEnd: string) {
  return {
    startIso: `${periodStart}T00:00:00.000-03:00`,
    endIso: `${periodEnd}T23:59:59.999-03:00`,
  }
}

function parseSpDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00-03:00`)
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function resolvePreviousPeriod(periodStart: string, periodEnd: string) {
  const start = parseSpDate(periodStart)
  const end = parseSpDate(periodEnd)
  const dayMs = 86_400_000
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / dayMs) + 1)

  const previousEnd = new Date(start.getTime() - dayMs)
  const previousStart = new Date(previousEnd.getTime() - (days - 1) * dayMs)

  return {
    previousStart: toIsoDate(previousStart),
    previousEnd: toIsoDate(previousEnd),
  }
}

export function spDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return isoDate
  return `${day}/${month}`
}

export function spDateKey(isoTimestamp: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(isoTimestamp))

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'
  return `${year}-${month}-${day}`
}

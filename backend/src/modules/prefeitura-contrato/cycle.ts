const MS_PER_DAY = 86_400_000
const SP_OFFSET = '-03:00'

export function todayIsoInBrazil(reference = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(reference)
}

function parseSpDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00${SP_OFFSET}`)
}

function startOfSpDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000${SP_OFFSET}`)
}

export function formatDateLabelBr(isoDate: string): string {
  const date = parseSpDate(isoDate)
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function getMonthlyCycle(reference = new Date()) {
  const todayKey = todayIsoInBrazil(reference)
  const [yearStr, monthStr] = todayKey.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)

  const cycleStart = `${yearStr}-${monthStr}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const cycleClose = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`

  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const nextCycleStart = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const today = startOfSpDay(todayKey)
  const cycleStartDate = startOfSpDay(cycleStart)
  const cycleCloseDate = startOfSpDay(cycleClose)

  const daysElapsed = Math.max(
    1,
    Math.round((today.getTime() - cycleStartDate.getTime()) / MS_PER_DAY) + 1,
  )
  const daysRemaining = Math.max(
    0,
    Math.round((cycleCloseDate.getTime() - today.getTime()) / MS_PER_DAY),
  )

  return {
    todayKey,
    cycleStart,
    cycleClose,
    nextCycleStart,
    daysInMonth: lastDay,
    daysElapsed,
    daysRemaining,
    startIso: `${cycleStart}T00:00:00.000${SP_OFFSET}`,
    endIso: `${cycleClose}T23:59:59.999${SP_OFFSET}`,
  }
}

export function monthBounds(year: number, month: number) {
  const monthStr = String(month).padStart(2, '0')
  const cycleStart = `${year}-${monthStr}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const cycleClose = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`

  return {
    cycleStart,
    cycleClose,
    startIso: `${cycleStart}T00:00:00.000${SP_OFFSET}`,
    endIso: `${cycleClose}T23:59:59.999${SP_OFFSET}`,
  }
}

export function monthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function monthKeyFromTimestamp(isoTimestamp: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date(isoTimestamp))

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  return `${year}-${month}`
}

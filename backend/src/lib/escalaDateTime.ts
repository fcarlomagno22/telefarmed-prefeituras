const APP_TIMEZONE = 'America/Sao_Paulo'

export function parseIsoToLocalDateAndTime(iso: string): { date: string; time: string } {
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) {
    throw new Error('Data/hora inválida.')
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(instant)

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '00'

  return {
    date: `${pick('year')}-${pick('month')}-${pick('day')}`,
    time: `${pick('hour')}:${pick('minute')}:${pick('second')}`,
  }
}

export function formatLocalTimestampAsIso(value: string): string {
  const normalized = value.trim().replace(' ', 'T')
  const withOffset = normalized.includes('+') || normalized.endsWith('Z')
    ? normalized
    : `${normalized}-03:00`
  const instant = new Date(withOffset)
  if (Number.isNaN(instant.getTime())) {
    return new Date().toISOString()
  }
  return instant.toISOString()
}

export function resolveTurnFromHour(hour: number): 'manha' | 'tarde' | 'noite' {
  if (hour < 12) return 'manha'
  if (hour < 18) return 'tarde'
  return 'noite'
}

export function resolveTurnLabel(turn: 'manha' | 'tarde' | 'noite'): string {
  switch (turn) {
    case 'manha':
      return 'Manhã'
    case 'tarde':
      return 'Tarde'
    default:
      return 'Noite'
  }
}

export function resolveTurnFromTime(time: string): { turn: 'manha' | 'tarde' | 'noite'; turnLabel: string } {
  const hour = Number.parseInt(time.split(':')[0] ?? '0', 10)
  const turn = resolveTurnFromHour(Number.isFinite(hour) ? hour : 0)
  return { turn, turnLabel: resolveTurnLabel(turn) }
}

export function monthStartIso(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

export const ESCALA_APP_TIMEZONE = 'America/Sao_Paulo'
export const ESCALA_APP_UTC_OFFSET = '-03:00'

export function normalizeClockFragment(time: string): { hours: string; minutes: string } {
  const [rawHour, rawMinute] = time.split(':')
  let hours = Number.parseInt(rawHour ?? '0', 10)
  const minutes = Number.parseInt(rawMinute ?? '0', 10)
  if (!Number.isFinite(hours)) hours = 0
  if (hours === 24) hours = 0

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(Number.isFinite(minutes) ? minutes : 0).padStart(2, '0'),
  }
}

/** Data (YYYY-MM-DD) + hora (HH:mm) sempre no fuso operacional Brasília. */
export function buildBrazilWallClockIso(date: string, time: string): string {
  const { hours, minutes } = normalizeClockFragment(time)
  const withOffset = `${date}T${hours}:${minutes}:00${ESCALA_APP_UTC_OFFSET}`
  const instant = new Date(withOffset)
  if (Number.isNaN(instant.getTime())) {
    throw new Error('Data/hora inválida.')
  }
  return instant.toISOString()
}

/** Converte ISO UTC para HH:mm no relógio operacional (Brasília). */
export function toBrazilTimeInputValue(iso: string): string {
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) return '08:00'

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ESCALA_APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant)

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '00'

  let hour = pick('hour')
  if (hour === '24') hour = '00'

  return `${hour}:${pick('minute')}`
}

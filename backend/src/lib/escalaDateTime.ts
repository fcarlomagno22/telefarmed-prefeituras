const APP_TIMEZONE = 'America/Sao_Paulo'
export const ESCALA_APP_UTC_OFFSET = '-03:00'

export function normalizeClockTime(time: string): string {
  const [rawHour, rawMinute, rawSecond] = time.split(':')
  let hour = Number.parseInt(rawHour ?? '0', 10)
  const minute = Number.parseInt(rawMinute ?? '0', 10)
  const second = Number.parseInt(rawSecond ?? '0', 10)
  if (!Number.isFinite(hour)) hour = 0
  if (hour === 24) hour = 0

  return [
    String(hour).padStart(2, '0'),
    String(Number.isFinite(minute) ? minute : 0).padStart(2, '0'),
    String(Number.isFinite(second) ? second : 0).padStart(2, '0'),
  ].join(':')
}

/** Monta ISO UTC a partir de data + hora no fuso operacional (Brasília). */
export function buildBrazilWallClockIso(date: string, time: string): string {
  const clock = normalizeClockTime(time.length <= 5 ? `${time}:00` : time)
  const withOffset = `${date}T${clock}${ESCALA_APP_UTC_OFFSET}`
  const instant = new Date(withOffset)
  if (Number.isNaN(instant.getTime())) {
    throw new Error('Data/hora inválida.')
  }
  return instant.toISOString()
}

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

  const hourRaw = pick('hour')
  const hour = hourRaw === '24' ? '00' : hourRaw

  return {
    date: `${pick('year')}-${pick('month')}-${pick('day')}`,
    time: normalizeClockTime(`${hour}:${pick('minute')}:${pick('second')}`),
  }
}

export function resolveSlotClockBoundsFromIso(
  startAt: string,
  endAt: string,
): { date: string; horaInicio: string; horaFim: string } {
  const startMs = new Date(startAt).getTime()
  const endMs = new Date(endAt).getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    throw new Error('Data/hora inválida.')
  }
  if (endMs <= startMs) {
    throw new Error('Horário final deve ser posterior ao inicial.')
  }

  const start = parseIsoToLocalDateAndTime(startAt)
  const end = parseIsoToLocalDateAndTime(endAt)

  return {
    date: start.date,
    horaInicio: start.time,
    horaFim: end.time,
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

/** Rótulo de turno considerando duração do plantão (plantões longos → Integral). */
export function resolveShiftTurnLabel(horaInicio: string, horaFim: string): string {
  const parseMinutes = (time: string) => {
    const [rawHour, rawMinute] = time.split(':')
    let hour = Number.parseInt(rawHour ?? '0', 10)
    const minute = Number.parseInt(rawMinute ?? '0', 10)
    if (!Number.isFinite(hour)) hour = 0
    if (hour === 24) hour = 0
    return hour * 60 + (Number.isFinite(minute) ? minute : 0)
  }

  const startMinutes = parseMinutes(horaInicio)
  let endMinutes = parseMinutes(horaFim)
  if (endMinutes <= startMinutes) endMinutes += 24 * 60

  const durationHours = (endMinutes - startMinutes) / 60
  if (durationHours >= 10) return 'Integral'

  return resolveTurnFromTime(horaInicio).turnLabel
}

export function monthStartIso(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

/** Converte data + hora do slot (America/Sao_Paulo) para instante ISO UTC. */
export function resolveSlotTimestampIso(data: string, hora: string): string {
  return formatLocalTimestampAsIso(`${data} ${hora}`)
}

export function isSlotEndReached(data: string, horaFim: string, now = new Date()): boolean {
  const endMs = new Date(resolveSlotTimestampIso(data, horaFim)).getTime()
  return !Number.isNaN(endMs) && now.getTime() >= endMs
}

export function isSlotStartReached(data: string, horaInicio: string, now = new Date()): boolean {
  const startMs = new Date(resolveSlotTimestampIso(data, horaInicio)).getTime()
  return !Number.isNaN(startMs) && now.getTime() >= startMs
}

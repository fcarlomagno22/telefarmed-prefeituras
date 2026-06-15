import type { PlantaoAceitePublico } from '../../types/plantaoAceitePublico'

const APP_TIMEZONE = 'America/Sao_Paulo'

function pickDatePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? '00'
}

function toIcsLocalDateTime(iso: string): string {
  const instant = new Date(iso)
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

  const hourRaw = pickDatePart(parts, 'hour')
  const hour = hourRaw === '24' ? '00' : hourRaw

  return [
    pickDatePart(parts, 'year'),
    pickDatePart(parts, 'month'),
    pickDatePart(parts, 'day'),
    'T',
    hour,
    pickDatePart(parts, 'minute'),
    pickDatePart(parts, 'second'),
  ].join('')
}

function toIcsUtcStamp(date = new Date()): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function buildLocation(plantao: PlantaoAceitePublico): string {
  if (plantao.modality === 'tele') return 'Telemedicina — Telefarmed'
  const parts = [plantao.unitName, plantao.fullAddress, plantao.city, plantao.cityUf]
    .map((item) => item?.trim())
    .filter(Boolean)
  return parts.join(', ') || 'Presencial — Telefarmed'
}

function buildDescription(plantao: PlantaoAceitePublico, plantaoId: string): string {
  const lines = [
    `Plantão de ${plantao.specialty} confirmado na Telefarmed.`,
    `Modalidade: ${plantao.modalityLabel}`,
    `ID: ${plantaoId}`,
    plantao.notes?.trim() ? `Observações: ${plantao.notes.trim()}` : '',
  ].filter(Boolean)
  return lines.join('\n')
}

function buildValarms(): string[] {
  return [
    ['BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Lembrete: plantão amanhã', 'END:VALARM'],
    ['BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Lembrete: plantão em 2 horas', 'END:VALARM'],
    ['BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Lembrete: plantão em 1 hora', 'END:VALARM'],
    ['BEGIN:VALARM', 'TRIGGER:-PT10M', 'ACTION:DISPLAY', 'DESCRIPTION:Lembrete: plantão em 10 minutos', 'END:VALARM'],
  ].flatMap((block) => block)
}

export function buildPlantaoCalendarIcs(
  plantao: PlantaoAceitePublico,
  plantaoId: string,
): string {
  const uid = `plantao-${plantaoId}@telefarmed.com.br`
  const summary = `Plantão ${plantao.specialty} — Telefarmed`
  const location = escapeIcsText(buildLocation(plantao))
  const description = escapeIcsText(buildDescription(plantao, plantaoId))

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Telefarmed//Plantao//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsUtcStamp()}`,
    `DTSTART;TZID=${APP_TIMEZONE}:${toIcsLocalDateTime(plantao.startAt)}`,
    `DTEND;TZID=${APP_TIMEZONE}:${toIcsLocalDateTime(plantao.endAt)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    ...buildValarms(),
    'END:VEVENT',
    'BEGIN:VTIMEZONE',
    `TZID:${APP_TIMEZONE}`,
    'X-LIC-LOCATION:America/Sao_Paulo',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0300',
    'TZOFFSETTO:-0300',
    'TZNAME:-03',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
    'END:VCALENDAR',
  ]

  return `${lines.join('\r\n')}\r\n`
}

export function downloadPlantaoCalendarIcs(
  plantao: PlantaoAceitePublico,
  plantaoId: string,
): void {
  const content = buildPlantaoCalendarIcs(plantao, plantaoId)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const slug = plantao.specialty
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `plantao-${slug || 'telefarmed'}.ics`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function buildPlantaoGoogleCalendarUrl(
  plantao: PlantaoAceitePublico,
  plantaoId: string,
): string {
  const start = toIcsLocalDateTime(plantao.startAt)
  const end = toIcsLocalDateTime(plantao.endAt)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Plantão ${plantao.specialty} — Telefarmed`,
    dates: `${start}/${end}`,
    details: buildDescription(plantao, plantaoId),
    location: buildLocation(plantao),
    ctz: APP_TIMEZONE,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

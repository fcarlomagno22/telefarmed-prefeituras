const APP_TIMEZONE = 'America/Sao_Paulo'

export type PlantaoIcsInput = {
  plantaoId: string
  specialty: string
  startAt: string
  endAt: string
  modality: 'tele' | 'presencial'
  modalityLabel: string
  unitName: string | null
  fullAddress: string | null
  city: string | null
  cityUf: string | null
  notes: string | null
}

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
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function buildLocation(plantao: PlantaoIcsInput): string {
  if (plantao.modality === 'tele') return 'Telemedicina — Telefarmed'
  const parts = [plantao.unitName, plantao.fullAddress, plantao.city, plantao.cityUf]
    .map((item) => item?.trim())
    .filter(Boolean)
  return parts.join(', ') || 'Presencial — Telefarmed'
}

function buildDescription(plantao: PlantaoIcsInput): string {
  const lines = [
    `Plantão de ${plantao.specialty} confirmado na Telefarmed.`,
    `Modalidade: ${plantao.modalityLabel}`,
    `ID: ${plantao.plantaoId}`,
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
  ].flat()
}

export function buildPlantaoIcsContent(plantao: PlantaoIcsInput): string {
  const uid = `plantao-${plantao.plantaoId}@telefarmed.com.br`
  const summary = `Plantão ${plantao.specialty} — Telefarmed`

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
    `DESCRIPTION:${escapeIcsText(buildDescription(plantao))}`,
    `LOCATION:${escapeIcsText(buildLocation(plantao))}`,
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

export function buildPlantaoIcsFilename(specialty: string): string {
  const slug = specialty
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return `plantao-${slug || 'telefarmed'}.ics`
}

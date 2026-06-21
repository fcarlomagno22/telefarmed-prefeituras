export function formatRh3ScheduleHour(raw: string): string {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return raw.trim()

  const hours = match[1].padStart(2, '0')
  const minutes = match[2]
  return `${hours}h${minutes}min`
}

/** Converte exibição (`09h30min`) ou valor da API (`09:30`, `09:30:00`) para `HH:mm`. */
export function parseRh3ScheduleHourToApi(raw: string): string {
  const trimmed = raw.trim()
  const displayMatch = trimmed.match(/^(\d{1,2})h(\d{2})min$/)
  if (displayMatch) {
    return `${displayMatch[1].padStart(2, '0')}:${displayMatch[2]}`
  }

  const apiMatch = trimmed.match(/^(\d{1,2}):(\d{2})/)
  if (apiMatch) {
    return `${apiMatch[1].padStart(2, '0')}:${apiMatch[2]}`
  }

  return trimmed
}

export function formatRh3ProfessionalName(raw: string | null | undefined): string {
  if (!raw?.trim()) return ''

  const trimmed = raw.trim()
  const commaIndex = trimmed.indexOf(',')
  if (commaIndex === -1) return trimmed

  const surname = trimmed.slice(0, commaIndex).trim()
  const givenName = trimmed.slice(commaIndex + 1).trim()
  if (!givenName) return surname
  if (!surname) return givenName
  return `${givenName} ${surname}`
}

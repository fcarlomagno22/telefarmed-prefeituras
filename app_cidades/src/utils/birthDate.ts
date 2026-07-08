export function maskBirthDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function parseBirthDateBrToIso(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return isValidBirthDateIso(trimmed) ? trimmed : null
  }

  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const iso = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

  return isValidBirthDateIso(iso) ? iso : null
}

function isValidBirthDateIso(iso: string): boolean {
  const [yearRaw, monthRaw, dayRaw] = iso.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return false
  }

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1920) {
    return false
  }

  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date <= today
}

export function isValidBirthDate(value: string): boolean {
  return parseBirthDateBrToIso(value) !== null
}

export function formatBirthDateIsoToBr(iso: string): string {
  const trimmed = iso.trim().slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (!match) return ''
  return `${match[3]}/${match[2]}/${match[1]}`
}

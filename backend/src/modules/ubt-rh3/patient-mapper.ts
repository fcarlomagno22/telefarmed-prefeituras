import type { Rh3Genero } from '../../lib/rh3/types.js'

export function splitPatientFullName(fullName: string): { nombre: string; apellido: string } {
  const trimmed = fullName.trim().replace(/\s+/g, ' ')
  if (!trimmed) return { nombre: 'Paciente', apellido: 'Telefarmed' }

  const parts = trimmed.split(' ')
  if (parts.length === 1) {
    return { nombre: parts[0], apellido: parts[0] }
  }

  return {
    nombre: parts[0],
    apellido: parts.slice(1).join(' '),
  }
}

export function mapPatientGenderToRh3(gender: string): Rh3Genero {
  const normalized = gender.trim().toLowerCase()
  if (normalized.startsWith('f')) return 'F'
  if (normalized.startsWith('m')) return 'M'
  return 'O'
}

/** Converte ISO (yyyy-mm-dd) ou BR (dd/mm/yyyy) para yyyy-mm-dd. */
export function normalizeBirthDateForRh3(birthDate: string): string {
  const trimmed = birthDate.trim()
  const brMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed)
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed)
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
  }

  return trimmed
}

export function todayIsoDateSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

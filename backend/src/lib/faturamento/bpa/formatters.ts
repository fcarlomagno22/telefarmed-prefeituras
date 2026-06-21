const DIACRITICS = /[\u0300-\u036f]/g

const INCOMPATIBLE_CHARS = /[^\x20-\x7E]/g

export function padLeft(value: string, length: number, char = '0'): string {
  const normalized = value.slice(0, length)
  return normalized.padStart(length, char)
}

export function padRight(value: string, length: number, char = ' '): string {
  const normalized = value.slice(0, length)
  return normalized.padEnd(length, char)
}

export function padSpaces(length: number): string {
  return ' '.repeat(length)
}

export function normalizeBpaText(value: string): string {
  return value
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(INCOMPATIBLE_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

export function formatCompetenciaAaaamm(competencia: string): string {
  return competencia.replace('-', '')
}

export function formatDateAaaammdd(iso: string): string {
  const date = new Date(iso)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

export function formatBirthDateAaaammdd(iso: string): string {
  const datePart = iso.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return padSpaces(8)
  return datePart.replace(/-/g, '')
}

export function computeAgeYears(atendimentoIso: string, birthIso: string): string {
  const atendimento = new Date(atendimentoIso)
  const birth = new Date(`${birthIso.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(atendimento.getTime()) || Number.isNaN(birth.getTime())) {
    return padLeft('', 3)
  }

  let age = atendimento.getUTCFullYear() - birth.getUTCFullYear()
  const monthDiff = atendimento.getUTCMonth() - birth.getUTCMonth()
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && atendimento.getUTCDate() < birth.getUTCDate())
  ) {
    age -= 1
  }

  return padLeft(String(Math.max(age, 0)), 3)
}

export function formatIbge6(ibge7: string | null | undefined): string | null {
  const digits = ibge7?.replace(/\D/g, '') ?? ''
  if (digits.length === 6) return digits
  if (digits.length === 7) return digits.slice(0, 6)
  return null
}

export function formatCidField(value: string | null | undefined): string {
  const normalized = normalizeBpaText(value ?? '').replace(/[^A-Z0-9]/g, '')
  if (!normalized) return padSpaces(4)
  return padRight(normalized.slice(0, 4), 4)
}

export function formatCnes(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, '') ?? ''
  return digits.length === 7 ? digits : null
}

export function formatCns15(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, '') ?? ''
  return digits.length === 15 ? digits : null
}

export function formatCpf11(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, '') ?? ''
  return digits.length === 11 ? digits : null
}

export function formatCnpjCpf14(value: string | null | undefined): string {
  const digits = value?.replace(/\D/g, '') ?? ''
  if (digits.length === 11 || digits.length === 14) {
    return padLeft(digits, 14)
  }
  return padSpaces(14)
}

export function mapSexoBpa(sexo: string | null | undefined): 'M' | 'F' | 'I' | null {
  if (sexo === 'masculino') return 'M'
  if (sexo === 'feminino') return 'F'
  if (sexo === 'nao_informado') return 'I'
  return null
}

export function mapRacaCorBpa(value: string | null | undefined): string | null {
  switch (value?.trim().toLowerCase()) {
    case 'branca':
      return '01'
    case 'preta':
      return '02'
    case 'parda':
      return '03'
    case 'amarela':
      return '04'
    case 'indigena':
      return '05'
    default:
      return null
  }
}

export function mapNacionalidadeBpa(value: string | null | undefined): string {
  switch (value?.trim().toLowerCase()) {
    case 'brasileira':
    case 'brasileira_nascido_exterior':
      return '010'
    case 'estrangeira':
      return '020'
    default:
      return '010'
  }
}

export function resolveEnderecoField(
  endereco: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const raw = endereco[key]
    if (typeof raw === 'string' && raw.trim()) {
      return normalizeBpaText(raw)
    }
  }
  return ''
}

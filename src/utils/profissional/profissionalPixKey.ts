import type {
  ProfissionalPixKeyType,
  ProfissionalPrestadorEmpresa,
} from '../../types/profissionalFinanceiro'
import { maskCnpj, maskPhone } from '../masks'

export type { ProfissionalPixKeyType }

export const profissionalPixKeyTypeOptions: { value: ProfissionalPixKeyType; label: string }[] = [
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'email', label: 'E-mail' },
  { value: 'aleatoria', label: 'Chave aleatória' },
]

/** EVP / UUID — 32 caracteres hexadecimais. */
export function maskPixRandomKey(value: string): string {
  const hex = value.replace(/[^a-fA-F0-9]/g, '').slice(0, 32).toLowerCase()

  if (hex.length <= 8) return hex
  if (hex.length <= 12) return `${hex.slice(0, 8)}-${hex.slice(8)}`
  if (hex.length <= 16) return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12)}`
  if (hex.length <= 20) {
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16)}`
  }
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function maskPixKeyValue(type: ProfissionalPixKeyType, value: string): string {
  switch (type) {
    case 'cnpj':
      return maskCnpj(value)
    case 'telefone':
      return maskPhone(value)
    case 'email':
      return value.trim().toLowerCase()
    case 'aleatoria':
      return maskPixRandomKey(value)
    default:
      return value
  }
}

export function formatRegisteredPixKey(
  type: ProfissionalPixKeyType,
  empresa: ProfissionalPrestadorEmpresa,
): string {
  return maskPixKeyValue(type, empresa.pixKeys[type])
}

export function defaultPixKeyForType(
  type: ProfissionalPixKeyType,
  empresa: ProfissionalPrestadorEmpresa,
): string {
  if (type === 'cnpj') return empresa.cnpj
  return ''
}

export function pixKeyPlaceholder(type: ProfissionalPixKeyType): string {
  switch (type) {
    case 'cnpj':
      return '00.000.000/0000-00'
    case 'telefone':
      return '(11) 99999-9999'
    case 'email':
      return 'financeiro@empresa.com.br'
    case 'aleatoria':
      return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    default:
      return ''
  }
}

export function normalizePixKeyForCompare(type: ProfissionalPixKeyType, value: string): string {
  switch (type) {
    case 'cnpj':
    case 'telefone':
      return value.replace(/\D/g, '')
    case 'email':
      return value.trim().toLowerCase()
    case 'aleatoria':
      return value.replace(/[^a-fA-F0-9]/g, '').toLowerCase()
    default:
      return value.trim()
  }
}

export function pixKeyIsFilled(type: ProfissionalPixKeyType, value: string): boolean {
  const normalized = normalizePixKeyForCompare(type, value)
  if (type === 'cnpj') return normalized.length === 14
  if (type === 'telefone') return normalized.length >= 10
  if (type === 'email') return normalized.includes('@') && normalized.includes('.')
  if (type === 'aleatoria') return normalized.length === 32
  return Boolean(normalized)
}

export function pixKeyMatchesEmpresa(
  type: ProfissionalPixKeyType,
  value: string,
  empresa: ProfissionalPrestadorEmpresa,
): boolean {
  if (!pixKeyIsFilled(type, value)) return false

  const input = normalizePixKeyForCompare(type, value)
  const registered = normalizePixKeyForCompare(type, empresa.pixKeys[type])

  return input === registered
}

export function pixKeyValidationMessage(
  type: ProfissionalPixKeyType,
  empresa: ProfissionalPrestadorEmpresa,
): string {
  const registeredLabel =
    profissionalPixKeyTypeOptions.find((option) => option.value === type)?.label ?? type
  const registeredValue = formatRegisteredPixKey(type, empresa)

  return `A chave PIX deve ser da mesma empresa do cadastro (${empresa.razaoSocial} · ${registeredLabel}: ${registeredValue}).`
}

export function inferPixKeyTypeFromValue(
  value: string,
  empresa: ProfissionalPrestadorEmpresa,
): ProfissionalPixKeyType {
  for (const option of profissionalPixKeyTypeOptions) {
    if (pixKeyMatchesEmpresa(option.value, value, empresa)) {
      return option.value
    }
  }
  return empresa.pixKeyType
}

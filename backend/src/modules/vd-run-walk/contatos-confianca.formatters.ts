import { VdRunWalkError } from './errors.js'

export const MAX_TRUSTED_CONTACTS = 5

export type RunWalkContatoConfiancaRow = {
  id: string
  paciente_id: string
  entidade_contratante_id: string
  client_contact_id: string
  name: string
  phone: string
  live_share_enabled: boolean
  is_active_sos: boolean
  sort_order: number
  deleted_at: string | null
  criado_em: string
  atualizado_em: string
}

export type TrustedContactDto = {
  id: string
  clientContactId: string
  name: string
  phone: string
  liveShareEnabled: boolean
  isActiveSos: boolean
}

export type TrustedContactsListDto = {
  contacts: TrustedContactDto[]
  activeSosContactId: string | null
}

export type CreateTrustedContactInput = {
  clientContactId: string
  name: string
  phone: string
  liveShareEnabled?: boolean
  isActiveSos?: boolean
}

export type UpdateTrustedContactInput = {
  name?: string
  phone?: string
  liveShareEnabled?: boolean
  isActiveSos?: boolean
}

export function extractBrazilPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function assertValidBrazilPhone(phone: string): string {
  const digits = extractBrazilPhoneDigits(phone)
  if (digits.length !== 10 && digits.length !== 11) {
    throw new VdRunWalkError(
      'Informe um telefone brasileiro válido com DDD.',
      'INVALID_DATA',
      400,
    )
  }
  return digits
}

export function formatBrazilPhone(digits: string): string {
  const normalized = extractBrazilPhoneDigits(digits)
  if (normalized.length === 10) {
    return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 6)}-${normalized.slice(6)}`
  }
  if (normalized.length === 11) {
    return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 7)}-${normalized.slice(7)}`
  }
  return digits
}

export function mapContatoConfiancaRowToDto(row: RunWalkContatoConfiancaRow): TrustedContactDto {
  return {
    id: row.id,
    clientContactId: row.client_contact_id,
    name: row.name.trim(),
    phone: formatBrazilPhone(row.phone),
    liveShareEnabled: row.live_share_enabled,
    isActiveSos: row.is_active_sos,
  }
}

export function mapContatosConfiancaRowsToListDto(
  rows: RunWalkContatoConfiancaRow[],
): TrustedContactsListDto {
  const contacts = rows.map(mapContatoConfiancaRowToDto)
  const active = contacts.find((contact) => contact.isActiveSos) ?? null

  return {
    contacts,
    activeSosContactId: active?.id ?? null,
  }
}

export function normalizeCreateTrustedContactInput(
  input: CreateTrustedContactInput,
): {
  clientContactId: string
  name: string
  phoneDigits: string
  liveShareEnabled: boolean
  isActiveSos: boolean
} {
  return {
    clientContactId: input.clientContactId.trim(),
    name: input.name.trim(),
    phoneDigits: assertValidBrazilPhone(input.phone),
    liveShareEnabled: input.liveShareEnabled ?? true,
    isActiveSos: input.isActiveSos ?? false,
  }
}

export function normalizeUpdateTrustedContactInput(
  input: UpdateTrustedContactInput,
): {
  name?: string
  phoneDigits?: string
  liveShareEnabled?: boolean
  isActiveSos?: boolean
} {
  const normalized: {
    name?: string
    phoneDigits?: string
    liveShareEnabled?: boolean
    isActiveSos?: boolean
  } = {}

  if (input.name !== undefined) {
    normalized.name = input.name.trim()
  }
  if (input.phone !== undefined) {
    normalized.phoneDigits = assertValidBrazilPhone(input.phone)
  }
  if (input.liveShareEnabled !== undefined) {
    normalized.liveShareEnabled = input.liveShareEnabled
  }
  if (input.isActiveSos !== undefined) {
    normalized.isActiveSos = input.isActiveSos
  }

  return normalized
}

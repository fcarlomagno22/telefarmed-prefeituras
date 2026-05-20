import { STALE_REGISTRATION_MONTHS } from '../config/userDrawer'

export type ChangeLogEntry = {
  id: string
  at: string
  authorLabel: string
  summary: string
  details?: string
}

export type ContactChannel = 'whatsapp' | 'sms' | 'telefone' | 'presencial' | 'outro'

export type PatientContactLogEntry = {
  id: string
  at: string
  channel: ContactChannel
  phone: string
  note?: string
  authorLabel: string
}

/** @deprecated Use PatientContactLogEntry */
export type CommunicationLogEntry = PatientContactLogEntry

export type TeamContactRecord = {
  at: string
  channel: ContactChannel
  note?: string
  authorLabel: string
}

export function createActivityId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function formatActivityDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function parseBrazilianDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2]) - 1
  const year = Number(match[3])
  const date = new Date(year, month, day)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null
  }
  return date
}

function monthsBetween(from: Date, to: Date) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}

export function isRegistrationStale(
  registeredAt: string,
  lastReviewedAt?: string | null,
  staleMonths = STALE_REGISTRATION_MONTHS,
) {
  const reference = lastReviewedAt
    ? new Date(lastReviewedAt)
    : parseBrazilianDate(registeredAt)
  if (!reference || Number.isNaN(reference.getTime())) return false
  return monthsBetween(reference, new Date()) >= staleMonths
}

export function buildEditChangeSummary(changedFields: string[]) {
  if (changedFields.length === 0) return 'Cadastro revisado'
  if (changedFields.length === 1) return `Alterado: ${changedFields[0]}`
  return `Alterados: ${changedFields.join(', ')}`
}

const contactChannelLabels: Record<ContactChannel, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  telefone: 'Telefone',
  presencial: 'Presencial',
  outro: 'Outro',
}

export function contactChannelLabel(channel: ContactChannel) {
  return contactChannelLabels[channel]
}

export function teamContactChannelLabel(channel: ContactChannel) {
  return contactChannelLabels[channel]
}

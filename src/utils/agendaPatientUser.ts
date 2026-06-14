import type { DayAppointment } from '../data/agendaMock'
import { onlyDigits } from './lgpdDisplay'

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function avatarClassForName(name: string) {
  const palettes = [
    'bg-emerald-100 text-emerald-700',
    'bg-sky-100 text-sky-700',
    'bg-violet-100 text-violet-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
  ] as const
  const index = name.length % palettes.length
  return palettes[index]!
}

export type AgendaPatientPreview = {
  id: string
  name: string
  initials: string
  avatarUrl?: string
  avatarClassName: string
  bairro: string
  phone: string
  cpf: string
  birthDate: string
  age: number
  lastAppointmentDate: string
  lastAppointmentRelative: string
  totalAppointments: number
}

function isDisplayableAvatarUrl(url?: string): boolean {
  const trimmed = url?.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('sb://')) return false
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/')
  )
}

function buildPatientPreviewFromAppointment(appointment: DayAppointment): AgendaPatientPreview {
  const avatarUrl = isDisplayableAvatarUrl(appointment.patientAvatarUrl)
    ? appointment.patientAvatarUrl!.trim()
    : undefined
  return {
    id: appointment.pacienteId ?? `agenda-${appointment.id}`,
    name: appointment.patientName,
    initials: initialsFromName(appointment.patientName),
    avatarUrl,
    avatarClassName: avatarClassForName(appointment.patientName),
    bairro: '—',
    phone: appointment.patientPhone,
    cpf: appointment.patientCpf,
    birthDate: '—',
    age: 0,
    lastAppointmentDate: '—',
    lastAppointmentRelative: `Hoje, ${appointment.time}`,
    totalAppointments: 0,
  }
}

export function findNetworkUserForAppointment(appointment: DayAppointment): AgendaPatientPreview {
  return buildPatientPreviewFromAppointment(appointment)
}

export function findAgendaPatientPreview(appointment: DayAppointment): AgendaPatientPreview {
  return buildPatientPreviewFromAppointment(appointment)
}

/** @deprecated use findAgendaPatientPreview — mantido para compatibilidade de imports */
export function matchAgendaPatientByCpf(appointment: DayAppointment, cpf: string): boolean {
  return onlyDigits(appointment.patientCpf) === onlyDigits(cpf)
}

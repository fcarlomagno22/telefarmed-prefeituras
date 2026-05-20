import type { DayAppointment } from '../data/agendaMock'
import { networkUsers, type NetworkUser } from '../data/networkUsersMock'
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

export function findNetworkUserForAppointment(appointment: DayAppointment): NetworkUser {
  const appointmentCpf = onlyDigits(appointment.patientCpf)
  const byCpf = networkUsers.find((user) => onlyDigits(user.cpf) === appointmentCpf)
  if (byCpf) return byCpf

  const normalizedName = appointment.patientName.trim().toLowerCase()
  const byName = networkUsers.find((user) => user.name.trim().toLowerCase() === normalizedName)
  if (byName) return byName

  return {
    id: `agenda-${appointment.id}`,
    name: appointment.patientName,
    initials: initialsFromName(appointment.patientName),
    avatarClassName: avatarClassForName(appointment.patientName),
    bairro: '—',
    phone: appointment.patientPhone,
    cpf: appointment.patientCpf,
    birthDate: '—',
    age: 0,
    lastAppointmentDate: '19/05/2026',
    lastAppointmentRelative: `Hoje, ${appointment.time}`,
    totalAppointments: 1,
  }
}

import type { ConsultationRecord } from '../data/consultasMock'
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

export function findNetworkUserForConsultation(record: ConsultationRecord): NetworkUser {
  const recordCpf = onlyDigits(record.cpf)
  const byCpf = networkUsers.find((user) => onlyDigits(user.cpf) === recordCpf)
  if (byCpf) return byCpf

  const normalizedName = record.patientName.trim().toLowerCase()
  const byName = networkUsers.find((user) => user.name.trim().toLowerCase() === normalizedName)
  if (byName) return byName

  return {
    id: `consulta-${record.id}`,
    name: record.patientName,
    initials: initialsFromName(record.patientName),
    avatarClassName: avatarClassForName(record.patientName),
    bairro: record.neighborhood,
    phone: '—',
    cpf: record.cpf,
    birthDate: '—',
    age: record.age,
    lastAppointmentDate: record.date,
    lastAppointmentRelative: `${record.date}, ${record.time}`,
    totalAppointments: 1,
  }
}

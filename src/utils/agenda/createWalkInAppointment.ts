import type { DayAppointment } from '../../data/agendaMock'
import {
  getPatientPreferredName,
  type AttendanceSession,
  type PatientRegistration,
} from '../../types/attendance'

const SLOT_TIMES = [
  '08:00', '08:20', '08:40', '09:00', '09:20', '09:40',
  '10:00', '10:20', '10:40', '11:00', '11:20', '11:40',
  '12:00', '14:00', '14:20', '14:40', '15:00', '15:20', '15:40',
  '16:00', '16:20', '16:40', '17:00', '17:20', '17:40',
] as const

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function formatTimeFromDate(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function findNextEncaixeTime(existingAppointments: DayAppointment[], now = new Date()) {
  const booked = new Set(existingAppointments.map((item) => item.time))
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  for (const slot of SLOT_TIMES) {
    if (booked.has(slot)) continue
    if (timeToMinutes(slot) >= nowMinutes - 10) return slot
  }

  const rounded = new Date(now)
  const remainder = rounded.getMinutes() % 20
  if (remainder !== 0) {
    rounded.setMinutes(rounded.getMinutes() + (20 - remainder))
  }
  return formatTimeFromDate(rounded)
}

export function createWalkInDayAppointment(
  registration: PatientRegistration,
  session: AttendanceSession,
  existingAppointments: DayAppointment[],
  now = new Date(),
): DayAppointment {
  const time = findNextEncaixeTime(existingAppointments, now)

  return {
    id: `walkin-${now.getTime()}`,
    time,
    patientName: getPatientPreferredName(registration),
    patientCpf: registration.cpf,
    patientPhone: registration.phone,
    serviceType: session.specialtyName,
    status: 'aguardando',
  }
}

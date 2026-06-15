import {
  AppointmentStatus,
  MyAppointmentsTab,
  StoredAppointment,
} from '../types/myAppointments'
import { parseScheduleTimeOnDate } from './scheduleCalendarEvent'

export function getAppointmentDateTime(appointment: StoredAppointment): Date {
  const [year, month, day] = appointment.selectedDate.split('-').map(Number)
  const base = new Date(year, month - 1, day)
  return parseScheduleTimeOnDate(base, appointment.selectedTime)
}

export function getAppointmentDurationMinutes(appointment: StoredAppointment): number {
  if (appointment.durationMinutes) return appointment.durationMinutes

  const hash = appointment.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return 20 + (hash % 21)
}

export function formatAppointmentDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (remainder === 0) return `${hours} h`
  return `${hours} h ${remainder} min`
}

export function isUpcomingAppointment(appointment: StoredAppointment): boolean {
  if (appointment.status !== 'confirmed' && appointment.status !== 'pending') {
    return false
  }

  return getAppointmentDateTime(appointment).getTime() >= Date.now()
}

export function isHistoryAppointment(appointment: StoredAppointment): boolean {
  return appointment.status === 'completed' || appointment.status === 'cancelled'
}

export function filterAppointmentsByTab(
  appointments: StoredAppointment[],
  tab: MyAppointmentsTab,
): StoredAppointment[] {
  const filtered =
    tab === 'upcoming'
      ? appointments.filter(isUpcomingAppointment)
      : appointments.filter(isHistoryAppointment)

  return filtered.sort((a, b) => {
    const delta = getAppointmentDateTime(a).getTime() - getAppointmentDateTime(b).getTime()
    return tab === 'upcoming' ? delta : -delta
  })
}

export function getNextUpcomingAppointment(
  appointments: StoredAppointment[],
): StoredAppointment | null {
  const upcoming = filterAppointmentsByTab(appointments, 'upcoming')
  return upcoming[0] ?? null
}

export function generateAppointmentProtocol(): string {
  const suffix = Math.floor(10000 + Math.random() * 90000)
  return `TF-${new Date().getFullYear()}-${suffix}`
}

export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  switch (status) {
    case 'confirmed':
      return 'Agendada'
    case 'pending':
      return 'Aguardando'
    case 'completed':
      return 'Realizada'
    case 'cancelled':
      return 'Cancelada'
    case 'no_show':
      return 'Não compareceu'
  }
}

export function getAppointmentStatusColors(status: AppointmentStatus): {
  background: string
  border: string
  text: string
} {
  switch (status) {
    case 'confirmed':
      return {
        background: 'rgba(16, 185, 129, 0.14)',
        border: 'rgba(16, 185, 129, 0.35)',
        text: '#6ee7b7',
      }
    case 'pending':
      return {
        background: 'rgba(245, 158, 11, 0.14)',
        border: 'rgba(245, 158, 11, 0.35)',
        text: '#fde68a',
      }
    case 'completed':
      return {
        background: 'rgba(14, 165, 233, 0.14)',
        border: 'rgba(14, 165, 233, 0.35)',
        text: '#7dd3fc',
      }
    case 'cancelled':
      return {
        background: 'rgba(255, 255, 255, 0.06)',
        border: 'rgba(255, 255, 255, 0.12)',
        text: 'rgba(245, 245, 247, 0.55)',
      }
    case 'no_show':
      return {
        background: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.35)',
        text: '#fca5a5',
      }
  }
}

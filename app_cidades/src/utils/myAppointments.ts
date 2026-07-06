import {
  AppointmentStatus,
  MyAppointmentsTab,
  StoredAppointment,
} from '../types/myAppointments'
import { colors } from '../theme/colors'
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
  cardGradient: readonly [string, string, string]
  cardBorder: string
} {
  const white = colors.cardBg

  switch (status) {
    case 'confirmed':
      return {
        background: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.24)',
        text: '#047857',
        cardGradient: [white, white, 'rgba(16, 185, 129, 0.06)'],
        cardBorder: 'rgba(16, 185, 129, 0.16)',
      }
    case 'pending':
      return {
        background: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.24)',
        text: '#b45309',
        cardGradient: [white, white, 'rgba(245, 158, 11, 0.06)'],
        cardBorder: 'rgba(245, 158, 11, 0.16)',
      }
    case 'completed':
      return {
        background: 'rgba(14, 165, 233, 0.12)',
        border: 'rgba(14, 165, 233, 0.24)',
        text: '#0369a1',
        cardGradient: [white, white, 'rgba(14, 165, 233, 0.06)'],
        cardBorder: 'rgba(14, 165, 233, 0.16)',
      }
    case 'cancelled':
      return {
        background: 'rgba(0, 0, 0, 0.05)',
        border: 'rgba(0, 0, 0, 0.1)',
        text: '#52525b',
        cardGradient: [white, white, 'rgba(0, 0, 0, 0.03)'],
        cardBorder: colors.surfaceBorder,
      }
    case 'no_show':
      return {
        background: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.22)',
        text: '#b91c1c',
        cardGradient: [white, white, 'rgba(239, 68, 68, 0.05)'],
        cardBorder: 'rgba(239, 68, 68, 0.14)',
      }
  }
}

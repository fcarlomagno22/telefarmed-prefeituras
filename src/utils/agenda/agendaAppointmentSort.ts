import type { AppointmentStatus, DayAppointment } from '../../data/agendaMock'

/** Ordem de exibição ao ordenar pela coluna Situação. */
export const APPOINTMENT_STATUS_SORT_ORDER: Record<AppointmentStatus, number> = {
  aguardando: 0,
  agendado: 1,
  em_atendimento: 2,
  realizado: 3,
  faltou: 4,
}

export function sortAppointmentsByTime(appointments: DayAppointment[]): DayAppointment[] {
  return [...appointments].sort((a, b) => a.time.localeCompare(b.time, 'pt-BR'))
}

export function sortAppointmentsByStatusOrder(
  appointments: DayAppointment[],
): DayAppointment[] {
  return [...appointments].sort((a, b) => {
    const byStatus =
      APPOINTMENT_STATUS_SORT_ORDER[a.status] - APPOINTMENT_STATUS_SORT_ORDER[b.status]
    if (byStatus !== 0) return byStatus
    return a.time.localeCompare(b.time, 'pt-BR')
  })
}

export function sortAppointmentsBySpecialty(
  appointments: DayAppointment[],
): DayAppointment[] {
  return [...appointments].sort((a, b) => {
    const bySpecialty = a.serviceType.localeCompare(b.serviceType, 'pt-BR', {
      sensitivity: 'base',
    })
    if (bySpecialty !== 0) return bySpecialty
    return a.time.localeCompare(b.time, 'pt-BR')
  })
}

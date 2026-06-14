import type { DayAppointment } from '../../data/agendaMock'

type AppointmentSpecialtySource = Pick<DayAppointment, 'serviceType' | 'specialtyId'> & {
  especialidadeId?: string
}

export function resolveAppointmentSpecialty(appointment: AppointmentSpecialtySource) {
  const specialtyId = appointment.specialtyId ?? appointment.especialidadeId ?? ''
  return {
    specialtyId,
    specialtyName: appointment.serviceType,
  }
}

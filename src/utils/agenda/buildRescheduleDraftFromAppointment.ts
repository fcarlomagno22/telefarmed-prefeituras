import type { DayAppointment } from '../../data/agendaMock'
import { getDoctorsForSpecialty } from '../../data/scheduleDoctorsMock'
import {
  emptyAttendanceSession,
  emptyPatientRegistration,
  inferAgeGroupFromBirthDate,
  type AttendanceSession,
  type PatientRegistration,
} from '../../types/attendance'
import { findNetworkUserForAppointment } from '../agendaPatientUser'
import type { ScheduleAppointmentInitialState } from '../../components/agenda/schedule/scheduleAppointmentTypes'
import { resolveAppointmentSpecialty } from './resolveAppointmentSpecialty'

function birthDateToIso(birthDate: string) {
  if (!birthDate || birthDate === '—') return ''
  const brMatch = birthDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brMatch) {
    const [, day, month, year] = brMatch
    return `${year}-${month}-${day}`
  }
  return birthDate
}

export function buildRescheduleDraftFromAppointment(
  appointment: DayAppointment,
  selectedDay: Date,
): ScheduleAppointmentInitialState {
  const networkUser = findNetworkUserForAppointment(appointment)
  const specialty = resolveAppointmentSpecialty(appointment)
  const doctors = specialty.specialtyId ? getDoctorsForSpecialty(specialty.specialtyId) : []
  const defaultDoctor = doctors[0]

  const registration: PatientRegistration = {
    ...emptyPatientRegistration(),
    fullName: networkUser.name,
    cpf: appointment.patientCpf,
    phone: appointment.patientPhone,
    birthDate: birthDateToIso(networkUser.birthDate),
    photoDataUrl: networkUser.avatarUrl ?? '',
  }

  const session: AttendanceSession = {
    specialtyId: specialty.specialtyId,
    specialtyName: specialty.specialtyName,
    ageGroup: registration.birthDate
      ? inferAgeGroupFromBirthDate(registration.birthDate)
      : null,
  }

  const step =
    session.specialtyId && defaultDoctor ? 'schedule_datetime' : 'specialty'

  return {
    mode: 'reschedule',
    rescheduleAppointmentId: appointment.id,
    step,
    registration,
    session,
    selectedDate: new Date(selectedDay),
    selectedDoctorId: defaultDoctor?.id ?? '',
    selectedTime: appointment.time,
    isReturningPatient: true,
    drawerTitle: 'Reagendar consulta',
    drawerSubtitle:
      'Confirme especialidade, médico e horário. Os dados do paciente já estão identificados.',
  }
}

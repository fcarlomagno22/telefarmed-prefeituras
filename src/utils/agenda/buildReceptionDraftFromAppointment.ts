import type { DayAppointment } from '../../data/agendaMock'
import { getNetworkUserProfile } from '../../data/networkUserProfiles'
import {
  emptyPatientContact,
  emptyPatientRegistration,
  inferAgeGroupFromBirthDate,
  type AttendanceSession,
  type PatientRegistration,
} from '../../types/attendance'
import { findNetworkUserForAppointment } from '../agendaPatientUser'
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

function genderValueFromLabel(label: string) {
  const normalized = label.toLowerCase()
  if (normalized.includes('femin')) return 'feminino'
  if (normalized.includes('mascul')) return 'masculino'
  if (normalized.includes('outro')) return 'outro'
  return ''
}

function blankIfDash(value: string) {
  return value === '—' ? '' : value
}

export function buildReceptionRegistrationFromAppointment(
  appointment: DayAppointment,
): PatientRegistration {
  const networkUser = findNetworkUserForAppointment(appointment)
  const profile = getNetworkUserProfile(networkUser)

  return {
    ...emptyPatientRegistration(),
    fullName: networkUser.name,
    cpf: appointment.patientCpf,
    phone: appointment.patientPhone,
    birthDate: birthDateToIso(networkUser.birthDate),
    gender: genderValueFromLabel(profile.genderLabel),
    email: blankIfDash(profile.email),
    guardianName: profile.guardianName,
    guardianCpf: profile.guardianCpf,
    contacts:
      profile.contacts.length > 0 ? profile.contacts.map((c) => ({ ...c })) : [emptyPatientContact()],
    zipCode: blankIfDash(profile.zipCode),
    street: blankIfDash(profile.street),
    number: blankIfDash(profile.number),
    complement: profile.complement,
    neighborhood: blankIfDash(profile.neighborhood) || networkUser.bairro,
    city: blankIfDash(profile.city),
    state: blankIfDash(profile.state),
    photoDataUrl: profile.photoDataUrl,
  }
}

export function buildReceptionSessionFromAppointment(
  appointment: DayAppointment,
  registration: PatientRegistration,
): AttendanceSession {
  const specialty = resolveAppointmentSpecialty(appointment)
  return {
    specialtyId: specialty.specialtyId,
    specialtyName: specialty.specialtyName,
    ageGroup: registration.birthDate
      ? inferAgeGroupFromBirthDate(registration.birthDate)
      : null,
  }
}

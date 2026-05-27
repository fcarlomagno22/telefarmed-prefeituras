import type { DayAppointment } from '../../data/agendaMock'
import { lookupPatientByCpf } from '../../data/patientLookup'
import type { WaitingQueueEntry } from '../../data/waitingQueueStore'
import {
  inferAgeGroupFromBirthDate,
  type AttendanceSession,
  type PatientRegistration,
  type StationStatus,
} from '../../data/unitDashboardMock'
import { buildReceptionRegistrationFromAppointment } from '../agenda/buildReceptionDraftFromAppointment'
import { resolveSpecialtyFromServiceType } from '../agenda/resolveSpecialtyFromServiceType'

export type AttendanceStartFromQueue = {
  registration: PatientRegistration
  session: AttendanceSession
  initialStatus: StationStatus
  pendingFirstVisit: boolean
}

function queueEntryToAppointment(entry: WaitingQueueEntry): DayAppointment {
  return {
    id: entry.appointmentId ?? entry.id,
    time: entry.scheduledTime ?? '00:00',
    patientName: entry.patientName,
    patientCpf: entry.patientCpf,
    patientPhone: entry.patientPhone ?? '',
    serviceType: entry.serviceType,
    status: entry.status ?? 'aguardando',
  }
}

function mergeRegistration(
  base: PatientRegistration,
  patch: PatientRegistration,
): PatientRegistration {
  return {
    ...base,
    ...patch,
    fullName: patch.fullName || base.fullName,
    socialName: patch.socialName.trim() ? patch.socialName : base.socialName,
    cpf: patch.cpf || base.cpf,
    phone: patch.phone || base.phone,
    contacts:
      patch.contacts.length > 0 && patch.contacts[0]?.name
        ? patch.contacts.map((c) => ({ ...c }))
        : base.contacts,
  }
}

export async function buildAttendanceStartFromQueueEntry(
  entry: WaitingQueueEntry,
): Promise<AttendanceStartFromQueue> {
  const appointment = queueEntryToAppointment(entry)
  let registration = buildReceptionRegistrationFromAppointment(appointment)
  const specialty = resolveSpecialtyFromServiceType(entry.serviceType)

  const session: AttendanceSession = {
    specialtyId: specialty?.id ?? '',
    specialtyName: specialty?.name ?? entry.serviceType,
    ageGroup: registration.birthDate
      ? inferAgeGroupFromBirthDate(registration.birthDate)
      : null,
  }

  const lookup = await lookupPatientByCpf(entry.patientCpf)

  if (lookup.status === 'found_pending_first_visit') {
    return {
      registration: { ...lookup.patient, photoDataUrl: '' },
      session: {
        ...session,
        specialtyId: lookup.specialtyId || session.specialtyId,
        specialtyName: lookup.specialtyName || session.specialtyName,
        ageGroup:
          inferAgeGroupFromBirthDate(lookup.patient.birthDate) ?? session.ageGroup,
      },
      initialStatus: 'registration',
      pendingFirstVisit: true,
    }
  }

  if (lookup.status === 'found') {
    registration = mergeRegistration(registration, lookup.patient)
    return {
      registration,
      session: {
        ...session,
        ageGroup:
          inferAgeGroupFromBirthDate(registration.birthDate) ?? session.ageGroup,
      },
      initialStatus: 'confirm_registration',
      pendingFirstVisit: false,
    }
  }

  return {
    registration,
    session,
    initialStatus: registration.fullName.trim() ? 'confirm_registration' : 'cpf_lookup',
    pendingFirstVisit: false,
  }
}

import type { DayAppointment } from '../../data/agendaMock'
import type { PatientLookupContext, PatientLookupResult } from '../../types/patientLookup'
import type { WaitingQueueEntry } from '../../types/waitingQueue'
import {
  emptyPatientRegistration,
  inferAgeGroupFromBirthDate,
  type AttendanceSession,
  type PatientRegistration,
  type StationStatus,
} from '../../types/attendance'
import { buildReceptionSessionFromAppointment } from '../agenda/buildReceptionDraftFromAppointment'

export type AttendanceStartFromQueue = {
  registration: PatientRegistration
  session: AttendanceSession
  initialStatus: StationStatus
  pendingFirstVisit: boolean
  patientId?: string
}

export type BuildAttendanceStartFromQueueOptions = {
  lookupByCpf: (cpf: string, context?: PatientLookupContext) => Promise<PatientLookupResult>
  loadByPacienteId?: (pacienteId: string) => Promise<PatientRegistration | null>
}

function queueEntryToAppointment(entry: WaitingQueueEntry): DayAppointment {
  return {
    id: entry.appointmentId ?? entry.id,
    time: entry.scheduledTime ?? '00:00',
    patientName: entry.patientName,
    patientCpf: entry.patientCpf,
    patientPhone: entry.patientPhone ?? '',
    serviceType: entry.serviceType,
    specialtyId: entry.specialtyId,
    status: 'aguardando',
    pacienteId: entry.pacienteId,
  }
}

function buildSession(entry: WaitingQueueEntry, registration: PatientRegistration): AttendanceSession {
  const appointment = queueEntryToAppointment(entry)
  const fromAppointment = buildReceptionSessionFromAppointment(appointment, registration)

  return {
    specialtyId: entry.specialtyId || fromAppointment.specialtyId,
    specialtyName: fromAppointment.specialtyName || entry.serviceType,
    ageGroup:
      inferAgeGroupFromBirthDate(registration.birthDate) ?? fromAppointment.ageGroup,
  }
}

function buildResult(
  registration: PatientRegistration,
  session: AttendanceSession,
  initialStatus: StationStatus,
  pendingFirstVisit: boolean,
  patientId?: string,
): AttendanceStartFromQueue {
  return {
    registration,
    session: {
      ...session,
      ageGroup: inferAgeGroupFromBirthDate(registration.birthDate) ?? session.ageGroup,
    },
    initialStatus,
    pendingFirstVisit,
    patientId,
  }
}

export async function buildAttendanceStartFromQueueEntry(
  entry: WaitingQueueEntry,
  options: BuildAttendanceStartFromQueueOptions,
): Promise<AttendanceStartFromQueue> {
  const fallbackSession = buildSession(entry, {
    ...emptyPatientRegistration(),
    fullName: entry.patientName,
    cpf: entry.patientCpf,
    phone: entry.patientPhone ?? '',
  })

  if (entry.pacienteId && options.loadByPacienteId) {
    const loaded = await options.loadByPacienteId(entry.pacienteId)
    if (loaded) {
      return buildResult(
        loaded,
        buildSession(entry, loaded),
        'confirm_registration',
        false,
        entry.pacienteId,
      )
    }
  }

  const lookup = await options.lookupByCpf(entry.patientCpf)

  if (lookup.status === 'found_pending_first_visit') {
    return buildResult(
      { ...lookup.patient, photoDataUrl: '' },
      {
        ...fallbackSession,
        specialtyId: lookup.specialtyId || fallbackSession.specialtyId,
        specialtyName: lookup.specialtyName || fallbackSession.specialtyName,
        ageGroup: inferAgeGroupFromBirthDate(lookup.patient.birthDate) ?? fallbackSession.ageGroup,
      },
      'registration',
      true,
      lookup.patientId,
    )
  }

  if (lookup.status === 'found') {
    return buildResult(
      lookup.patient,
      buildSession(entry, lookup.patient),
      'confirm_registration',
      false,
      lookup.patientId,
    )
  }

  return buildResult(
    {
      ...emptyPatientRegistration(),
      fullName: entry.patientName,
      cpf: entry.patientCpf,
      phone: entry.patientPhone ?? '',
    },
    fallbackSession,
    entry.patientName.trim() ? 'confirm_registration' : 'cpf_lookup',
    false,
  )
}

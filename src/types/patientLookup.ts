import type { PatientRegistration } from './attendance'

export type PatientLookupContext = {
  specialtyId: string
  specialtyName: string
}

export type PatientLookupResult =
  | { status: 'found'; patient: PatientRegistration; patientId?: string }
  | {
      status: 'found_pending_first_visit'
      patient: PatientRegistration
      specialtyId: string
      specialtyName: string
      patientId?: string
    }
  | { status: 'not_found' }

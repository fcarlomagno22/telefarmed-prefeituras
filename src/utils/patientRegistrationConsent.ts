import type { PatientNationality, PatientRaceColor } from './patientRegistrationOptions'
import { requiresGuardianValidation } from './patientRegistrationValidation'

export type PatientRegistrationConsent = {
  dataReviewed: boolean
  teleconsultationAuthorized: boolean
  dataUsageAcknowledged: boolean
  notificationsAllowed: boolean
  operatorName: string
  registeredAt: string
  registrationUnitId: string
  registrationUnitName: string
  operatorUserId?: string
  operatorAdminId?: string
}

export type PatientRegistrationOperatorContext = {
  operatorName: string
  registrationUnitId?: string
  registrationUnitName: string
  operatorUserId?: string
  operatorAdminId?: string
}

export function emptyPatientRegistrationConsent(): PatientRegistrationConsent {
  return {
    dataReviewed: false,
    teleconsultationAuthorized: false,
    dataUsageAcknowledged: false,
    notificationsAllowed: false,
    operatorName: '',
    registeredAt: '',
    registrationUnitId: '',
    registrationUnitName: '',
  }
}

export function buildPatientRegistrationConsentDraft(
  operator: PatientRegistrationOperatorContext,
): PatientRegistrationConsent {
  return {
    ...emptyPatientRegistrationConsent(),
    operatorName: operator.operatorName,
    registeredAt: new Date().toISOString(),
    registrationUnitId: operator.registrationUnitId ?? '',
    registrationUnitName: operator.registrationUnitName,
    operatorUserId: operator.operatorUserId,
    operatorAdminId: operator.operatorAdminId,
  }
}

export function finalizePatientRegistrationConsent(
  consent: PatientRegistrationConsent,
): PatientRegistrationConsent {
  return {
    ...consent,
    dataReviewed: true,
    teleconsultationAuthorized: true,
    dataUsageAcknowledged: true,
    notificationsAllowed: true,
    registeredAt: new Date().toISOString(),
  }
}

export function isPatientRegistrationConsentReady(consent: PatientRegistrationConsent | null) {
  if (!consent) return false
  return (
    consent.dataReviewed &&
    consent.teleconsultationAuthorized &&
    consent.dataUsageAcknowledged &&
    consent.notificationsAllowed &&
    Boolean(consent.operatorName.trim()) &&
    Boolean(consent.registrationUnitName.trim())
  )
}

export function patientHasGuardianSection(
  ageGroup: 'adult' | 'minor' | 'elderly',
  data: {
    guardianName: string
    guardianCpf: string
  },
) {
  return requiresGuardianValidation(ageGroup, data)
}

export type { PatientNationality, PatientRaceColor }

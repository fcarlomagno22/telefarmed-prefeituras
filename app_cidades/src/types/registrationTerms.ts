export type LegalAcceptances = {
  termsOfUse: boolean
  privacyPolicy: boolean
  lgpdConsent: boolean
  healthDataConsent: boolean
  communicationsConsent: boolean
}

export type AppLegalAcceptanceKey = keyof LegalAcceptances

export type RegistrationConsentTerm = {
  id: string
  title: string
  content: string
  version: string
  updatedAtLabel: string
}

export type AppRegistrationConsentTerm = RegistrationConsentTerm & {
  acceptanceKey: AppLegalAcceptanceKey
  secondaryDocumentId?: string
}

export type AppRegistrationConsentTermsResponse = {
  terms: Record<AppLegalAcceptanceKey, AppRegistrationConsentTerm>
}

export type PatientRegistrationConsentTermKey =
  | 'dataReviewed'
  | 'teleconsultationAuthorized'
  | 'dataUsageAcknowledged'
  | 'notificationsAllowed'

export type PatientRegistrationConsentTermsResponse = {
  terms: Record<PatientRegistrationConsentTermKey, RegistrationConsentTerm>
}

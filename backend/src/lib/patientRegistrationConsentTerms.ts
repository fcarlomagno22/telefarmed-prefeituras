export const PATIENT_REGISTRATION_CONSENT_TERM_IDS = {
  dataReviewed: 'cadastro_conferencia_dados',
  teleconsultationAuthorized: 'cadastro_autorizacao_teleconsulta',
  dataUsageAcknowledged: 'cadastro_ciencia_dados',
  notificationsAllowed: 'cadastro_permissao_notificacoes',
} as const

export type PatientRegistrationConsentTermKey =
  keyof typeof PATIENT_REGISTRATION_CONSENT_TERM_IDS

export const PATIENT_REGISTRATION_CONSENT_TERM_KEYS = Object.keys(
  PATIENT_REGISTRATION_CONSENT_TERM_IDS,
) as PatientRegistrationConsentTermKey[]

export const PATIENT_REGISTRATION_CONSENT_TERM_DOCUMENT_IDS = Object.values(
  PATIENT_REGISTRATION_CONSENT_TERM_IDS,
)

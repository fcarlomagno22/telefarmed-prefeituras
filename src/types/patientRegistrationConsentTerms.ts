export const PATIENT_REGISTRATION_CONSENT_TERM_IDS = {
  dataReviewed: 'cadastro_conferencia_dados',
  teleconsultationAuthorized: 'cadastro_autorizacao_teleconsulta',
  dataUsageAcknowledged: 'cadastro_ciencia_dados',
  notificationsAllowed: 'cadastro_permissao_notificacoes',
} as const

export type PatientRegistrationConsentTermKey =
  keyof typeof PATIENT_REGISTRATION_CONSENT_TERM_IDS

export type PatientRegistrationConsentTerm = {
  id: string
  title: string
  content: string
  version: string
  updatedAtLabel: string
}

export type PatientRegistrationConsentTermsCatalog = Record<
  PatientRegistrationConsentTermKey,
  PatientRegistrationConsentTerm
>

export type PatientRegistrationConsentTermsResponse = {
  terms: PatientRegistrationConsentTermsCatalog
}

export const patientRegistrationConsentTermLabels: Record<PatientRegistrationConsentTermKey, string> =
  {
    dataReviewed: 'Confirmo que os dados foram conferidos',
    teleconsultationAuthorized: 'Autorização para atendimento por teleconsulta',
    dataUsageAcknowledged:
      'Ciência sobre uso de dados para assistência e registros administrativos',
    notificationsAllowed: 'Permissão para receber notificações',
  }

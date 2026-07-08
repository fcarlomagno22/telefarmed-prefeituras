import { z } from 'zod'
import type { PatientRegistrationConsentInput } from '../modules/admin-pacientes/types.js'

/**
 * Consentimentos exibidos no app_cidades (RegisterStepLegal).
 *
 * Mapeamento para os 4 flags núcleo da UBT (`consentimento_cadastro`):
 *
 * | App (5 aceites)          | Flag UBT / JSONB              | Documento legal (config_documentos_legais)     |
 * |--------------------------|-------------------------------|------------------------------------------------|
 * | termsOfUse               | dados_conferidos              | vd_cadastro_termos_uso                         |
 * | privacyPolicy            | ciencia_dados (parcial)       | privacidade                                    |
 * | lgpdConsent              | ciencia_dados (parcial)       | lgpd                                           |
 * | healthDataConsent        | autorizacao_teleconsulta      | cadastro_autorizacao_teleconsulta              |
 * |                          | + ciencia_dados (dados saúde) | cadastro_ciencia_dados (referência auditável)  |
 * | communicationsConsent    | permissao_notificacoes        | cadastro_permissao_notificacoes                |
 *
 * Self-service: `operador_nome` = "Autoatendimento"; `unidade_ubt_nome` = entidade/município.
 * Nome do paciente fica em `paciente_nome`. Metadados extras em `app_aceites` e `canal: app_vd`.
 */
export const APP_LEGAL_ACCEPTANCE_KEYS = [
  'termsOfUse',
  'privacyPolicy',
  'lgpdConsent',
  'healthDataConsent',
  'communicationsConsent',
] as const

export type AppLegalAcceptanceKey = (typeof APP_LEGAL_ACCEPTANCE_KEYS)[number]

/** Documentos legais referenciados por cada aceite do app. */
export const APP_LEGAL_ACCEPTANCE_DOCUMENT_IDS: Record<AppLegalAcceptanceKey, string> = {
  termsOfUse: 'vd_cadastro_termos_uso',
  privacyPolicy: 'privacidade',
  lgpdConsent: 'lgpd',
  healthDataConsent: 'cadastro_autorizacao_teleconsulta',
  communicationsConsent: 'cadastro_permissao_notificacoes',
}

/** Documento complementar citado na auditoria de dados sensíveis de saúde. */
export const APP_HEALTH_DATA_SECONDARY_DOCUMENT_ID = 'cadastro_ciencia_dados'

/** Aceites do app que satisfazem cada flag núcleo UBT (trilha de auditoria). */
export const APP_TO_UBT_CONSENT_SOURCE_KEYS = {
  dataReviewed: ['termsOfUse'],
  teleconsultationAuthorized: ['healthDataConsent'],
  dataUsageAcknowledged: ['privacyPolicy', 'lgpdConsent', 'healthDataConsent'],
  notificationsAllowed: ['communicationsConsent'],
} as const satisfies Record<
  keyof Pick<
    PatientRegistrationConsentInput,
    | 'dataReviewed'
    | 'teleconsultationAuthorized'
    | 'dataUsageAcknowledged'
    | 'notificationsAllowed'
  >,
  readonly AppLegalAcceptanceKey[]
>

export const SELF_SERVICE_OPERATOR_NAME_DEFAULT = 'Autoatendimento'
/** @deprecated Use SELF_SERVICE_OPERATOR_NAME_DEFAULT */
export const SELF_SERVICE_OPERATOR_NAME_FALLBACK = SELF_SERVICE_OPERATOR_NAME_DEFAULT
export const CONSENTIMENTO_CANAL_APP_VD = 'app_vd'

/** 4 literais UBT + metadados self-service (operador/unidade/data preenchidos server-side). */
export const appRegistrationConsentSchema = z.object({
  dataReviewed: z.literal(true),
  teleconsultationAuthorized: z.literal(true),
  dataUsageAcknowledged: z.literal(true),
  notificationsAllowed: z.literal(true),
  operatorName: z.string().trim().min(1).default(SELF_SERVICE_OPERATOR_NAME_DEFAULT),
  registeredAt: z.string().trim().min(1),
  registrationUnitName: z.string().trim().min(1),
})

export type AppRegistrationConsent = z.infer<typeof appRegistrationConsentSchema>

export const appLegalAcceptancesSchema = z.object({
  termsOfUse: z.literal(true, {
    errorMap: () => ({ message: 'Aceite os Termos de Uso para continuar.' }),
  }),
  privacyPolicy: z.literal(true, {
    errorMap: () => ({ message: 'Aceite a Política de Privacidade para continuar.' }),
  }),
  lgpdConsent: z.literal(true, {
    errorMap: () => ({ message: 'Aceite o consentimento LGPD para continuar.' }),
  }),
  healthDataConsent: z.literal(true, {
    errorMap: () => ({ message: 'Aceite o tratamento de dados sensíveis de saúde para continuar.' }),
  }),
  communicationsConsent: z.literal(true, {
    errorMap: () => ({ message: 'Aceite receber comunicações operacionais do serviço para continuar.' }),
  }),
  acceptedAt: z.string().trim().min(1).optional(),
})

export type AppLegalAcceptancesInput = z.infer<typeof appLegalAcceptancesSchema>

export const selfServiceRegistrationConsentContextSchema = z.object({
  patientName: z.string().trim().min(1),
  entityDisplayName: z.string().trim().min(1),
  entidadeId: z.string().uuid().optional(),
})

export type SelfServiceRegistrationConsentContext = z.infer<
  typeof selfServiceRegistrationConsentContextSchema
>

/** Entrada do cadastro app: aceites + contexto da entidade (sem operador UBT). */
export const appRegistrationConsentInputSchema = z.object({
  acceptances: appLegalAcceptancesSchema,
  context: selfServiceRegistrationConsentContextSchema,
})

export type AppRegistrationConsentInput = z.infer<typeof appRegistrationConsentInputSchema>

/**
 * Variante self-service do consentimento de cadastro.
 * Operador e unidade são preenchidos automaticamente a partir do contexto do app.
 */
export const registrationConsentSelfServiceInputSchema = appRegistrationConsentInputSchema

export type RegistrationConsentSelfServiceInput = AppRegistrationConsentInput

export type AppLegalAcceptanceAuditEntry = {
  chave: AppLegalAcceptanceKey
  documento_id: string
  aceito_em: string
  documento_secundario_id?: string
}

export function resolveSelfServiceOperatorName(_patientName?: string): string {
  return SELF_SERVICE_OPERATOR_NAME_DEFAULT
}

export function resolveRegistrationAcceptedAt(acceptances: AppLegalAcceptancesInput): string {
  return acceptances.acceptedAt?.trim() || new Date().toISOString()
}

/** Monta consentimento UBT-shaped a partir dos 5 aceites do app + contexto da entidade. */
export function buildAppRegistrationConsent(
  input: AppRegistrationConsentInput,
): AppRegistrationConsent {
  return appRegistrationConsentSchema.parse({
    dataReviewed: true,
    teleconsultationAuthorized: true,
    dataUsageAcknowledged: true,
    notificationsAllowed: true,
    operatorName: SELF_SERVICE_OPERATOR_NAME_DEFAULT,
    registeredAt: resolveRegistrationAcceptedAt(input.acceptances),
    registrationUnitName: input.context.entityDisplayName.trim(),
  })
}

/** Converte os 5 aceites do app nos 4 literais exigidos pelo schema UBT/admin. */
export function mapAppAcceptancesToRegistrationConsent(
  input: AppRegistrationConsentInput,
): PatientRegistrationConsentInput {
  const consent = buildAppRegistrationConsent(input)

  return {
    dataReviewed: consent.dataReviewed,
    teleconsultationAuthorized: consent.teleconsultationAuthorized,
    dataUsageAcknowledged: consent.dataUsageAcknowledged,
    notificationsAllowed: consent.notificationsAllowed,
    operatorName: consent.operatorName,
    registeredAt: consent.registeredAt,
    registrationUnitName: consent.registrationUnitName,
  }
}

function buildAppAceitesAuditTrail(
  acceptances: AppLegalAcceptancesInput,
): Record<string, AppLegalAcceptanceAuditEntry> {
  const acceptedAt = resolveRegistrationAcceptedAt(acceptances)

  const entries: Record<string, AppLegalAcceptanceAuditEntry> = {
    termos_uso: {
      chave: 'termsOfUse',
      documento_id: APP_LEGAL_ACCEPTANCE_DOCUMENT_IDS.termsOfUse,
      aceito_em: acceptedAt,
    },
    politica_privacidade: {
      chave: 'privacyPolicy',
      documento_id: APP_LEGAL_ACCEPTANCE_DOCUMENT_IDS.privacyPolicy,
      aceito_em: acceptedAt,
    },
    lgpd: {
      chave: 'lgpdConsent',
      documento_id: APP_LEGAL_ACCEPTANCE_DOCUMENT_IDS.lgpdConsent,
      aceito_em: acceptedAt,
    },
    dados_saude: {
      chave: 'healthDataConsent',
      documento_id: APP_LEGAL_ACCEPTANCE_DOCUMENT_IDS.healthDataConsent,
      documento_secundario_id: APP_HEALTH_DATA_SECONDARY_DOCUMENT_ID,
      aceito_em: acceptedAt,
    },
    comunicacoes: {
      chave: 'communicationsConsent',
      documento_id: APP_LEGAL_ACCEPTANCE_DOCUMENT_IDS.communicationsConsent,
      aceito_em: acceptedAt,
    },
  }

  return entries
}

/** Monta o JSONB `consentimento_cadastro` para cadastro self-service via app. */
export function buildConsentimentoCadastroFromAppRegistration(
  input: AppRegistrationConsentInput,
): Record<string, unknown> {
  const consent = mapAppAcceptancesToRegistrationConsent(input)
  const acceptedAt = consent.registeredAt

  return {
    dados_conferidos: consent.dataReviewed,
    autorizacao_teleconsulta: consent.teleconsultationAuthorized,
    ciencia_dados: consent.dataUsageAcknowledged,
    permissao_notificacoes: consent.notificationsAllowed,
    operador_nome: consent.operatorName,
    cadastrado_em: acceptedAt,
    unidade_ubt_nome: consent.registrationUnitName,
    ...(consent.registrationUnitId ? { entidade_contratante_id: consent.registrationUnitId } : {}),
    ...(input.context.entidadeId ? { entidade_contratante_id: input.context.entidadeId } : {}),
    paciente_nome: input.context.patientName.trim(),
    canal: CONSENTIMENTO_CANAL_APP_VD,
    app_aceites: buildAppAceitesAuditTrail(input.acceptances),
    mapeamento_ubt: APP_TO_UBT_CONSENT_SOURCE_KEYS,
  }
}

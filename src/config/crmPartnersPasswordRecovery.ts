export const CRM_PARTNERS_PASSWORD_RECOVERY_CODE_LENGTH = 8
export const CRM_PARTNERS_PASSWORD_RECOVERY_CODE_EXPIRES_MINUTES = 15

export type CrmPartnersPasswordRecoveryStepId =
  | 'cpf'
  | 'emailSent'
  | 'code'
  | 'password'
  | 'success'

export const crmPartnersPasswordRecoverySteps = [
  { id: 'cpf' as const, label: 'CPF' },
  { id: 'code' as const, label: 'Código' },
  { id: 'password' as const, label: 'Nova senha' },
] satisfies ReadonlyArray<{
  id: Exclude<CrmPartnersPasswordRecoveryStepId, 'success' | 'emailSent'>
  label: string
}>

export type CrmPartnersPasswordRecoveryStepperStepId =
  (typeof crmPartnersPasswordRecoverySteps)[number]['id']

export function resolveCrmPartnersPasswordRecoveryStepperStep(
  step: CrmPartnersPasswordRecoveryStepId,
): CrmPartnersPasswordRecoveryStepperStepId {
  if (step === 'emailSent') return 'code'
  if (step === 'success') return 'password'
  return step
}

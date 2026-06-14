export const ADMIN_PASSWORD_RECOVERY_CODE_LENGTH = 8
export const ADMIN_PASSWORD_RECOVERY_CODE_EXPIRES_MINUTES = 15

export type AdminPasswordRecoveryStepId =
  | 'cpf'
  | 'emailSent'
  | 'code'
  | 'password'
  | 'success'

export const adminPasswordRecoverySteps = [
  { id: 'cpf' as const, label: 'CPF' },
  { id: 'code' as const, label: 'Código' },
  { id: 'password' as const, label: 'Nova senha' },
] satisfies ReadonlyArray<{ id: Exclude<AdminPasswordRecoveryStepId, 'success' | 'emailSent'>; label: string }>

export type AdminPasswordRecoveryStepperStepId = (typeof adminPasswordRecoverySteps)[number]['id']

export function resolveAdminPasswordRecoveryStepperStep(
  step: AdminPasswordRecoveryStepId,
): AdminPasswordRecoveryStepperStepId {
  if (step === 'emailSent') return 'code'
  if (step === 'success') return 'password'
  return step
}

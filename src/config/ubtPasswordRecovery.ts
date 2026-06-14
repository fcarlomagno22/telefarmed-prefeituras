export const UBT_PASSWORD_RECOVERY_CODE_LENGTH = 8
export const UBT_PASSWORD_RECOVERY_CODE_EXPIRES_MINUTES = 15

export type UbtPasswordRecoveryStepId =
  | 'cpf'
  | 'emailSent'
  | 'code'
  | 'password'
  | 'success'

export const ubtPasswordRecoverySteps = [
  { id: 'cpf' as const, label: 'CPF' },
  { id: 'code' as const, label: 'Código' },
  { id: 'password' as const, label: 'Nova senha' },
] satisfies ReadonlyArray<{ id: Exclude<UbtPasswordRecoveryStepId, 'success' | 'emailSent'>; label: string }>

export type UbtPasswordRecoveryStepperStepId = (typeof ubtPasswordRecoverySteps)[number]['id']

export function resolveUbtPasswordRecoveryStepperStep(
  step: UbtPasswordRecoveryStepId,
): UbtPasswordRecoveryStepperStepId {
  if (step === 'emailSent') return 'code'
  if (step === 'success') return 'password'
  return step
}

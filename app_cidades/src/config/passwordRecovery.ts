export const PASSWORD_RECOVERY_CODE_LENGTH = 8
export const PASSWORD_RECOVERY_CODE_EXPIRES_MINUTES = 15

export type PasswordRecoveryStep =
  | 'cpf'
  | 'emailSent'
  | 'code'
  | 'password'
  | 'success'

export function resolveRecoveryTimelineStep(
  step: PasswordRecoveryStep,
): 1 | 2 | 3 | null {
  if (step === 'cpf') return 1
  if (step === 'emailSent' || step === 'code') return 2
  if (step === 'password') return 3
  return null
}

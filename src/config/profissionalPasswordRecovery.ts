export const PROFISSIONAL_PASSWORD_RECOVERY_CODE_LENGTH = 8
export const PROFISSIONAL_PASSWORD_RECOVERY_CODE_EXPIRES_MINUTES = 15

export type ProfissionalPasswordRecoveryStepId =
  | 'cpf'
  | 'emailSent'
  | 'code'
  | 'password'
  | 'success'

export const profissionalPasswordRecoverySteps = [
  { id: 'cpf' as const, label: 'CPF' },
  { id: 'code' as const, label: 'Código' },
  { id: 'password' as const, label: 'Nova senha' },
] satisfies ReadonlyArray<{
  id: Exclude<ProfissionalPasswordRecoveryStepId, 'success' | 'emailSent'>
  label: string
}>

export type ProfissionalPasswordRecoveryStepperStepId =
  (typeof profissionalPasswordRecoverySteps)[number]['id']

export function resolveProfissionalPasswordRecoveryStepperStep(
  step: ProfissionalPasswordRecoveryStepId,
): ProfissionalPasswordRecoveryStepperStepId {
  if (step === 'emailSent') return 'code'
  if (step === 'success') return 'password'
  return step
}

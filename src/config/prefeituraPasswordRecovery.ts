export const PREFEITURA_PASSWORD_RECOVERY_CODE_LENGTH = 8
export const PREFEITURA_PASSWORD_RECOVERY_CODE_EXPIRES_MINUTES = 15

export type PrefeituraPasswordRecoveryStepId =
  | 'cpf'
  | 'emailSent'
  | 'code'
  | 'password'
  | 'success'

export const prefeituraPasswordRecoverySteps = [
  { id: 'cpf' as const, label: 'CPF' },
  { id: 'code' as const, label: 'Código' },
  { id: 'password' as const, label: 'Nova senha' },
] satisfies ReadonlyArray<{
  id: Exclude<PrefeituraPasswordRecoveryStepId, 'success' | 'emailSent'>
  label: string
}>

export type PrefeituraPasswordRecoveryStepperStepId =
  (typeof prefeituraPasswordRecoverySteps)[number]['id']

export function resolvePrefeituraPasswordRecoveryStepperStep(
  step: PrefeituraPasswordRecoveryStepId,
): PrefeituraPasswordRecoveryStepperStepId {
  if (step === 'emailSent') return 'code'
  if (step === 'success') return 'password'
  return step
}

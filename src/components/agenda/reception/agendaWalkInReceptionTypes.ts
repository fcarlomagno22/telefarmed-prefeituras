export type AgendaWalkInReceptionStep =
  | 'specialty'
  | 'cpf_lookup'
  | 'confirm_registration'
  | 'age_group'
  | 'registration'
  | 'contacts'
  | 'address'
  | 'photo'
  | 'success'

export const walkInReceptionFlowSteps = [
  { id: 'specialty', label: 'Especialidade' },
  { id: 'register', label: 'Cadastro' },
  { id: 'photo', label: 'Foto' },
  { id: 'queue', label: 'Na fila' },
] as const

export function resolveWalkInReceptionStepIndex(step: AgendaWalkInReceptionStep): number {
  if (step === 'specialty') return 0
  if (step === 'photo') return 2
  if (step === 'success') return 3
  return 1
}

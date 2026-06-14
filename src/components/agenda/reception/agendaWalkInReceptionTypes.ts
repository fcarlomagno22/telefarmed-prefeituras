export type AgendaWalkInReceptionStep =
  | 'specialty'
  | 'schedule_datetime'
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
  { id: 'schedule', label: 'Médico e horário' },
  { id: 'register', label: 'Cadastro' },
  { id: 'photo', label: 'Foto' },
  { id: 'queue', label: 'Na fila' },
] as const

export function resolveWalkInReceptionStepIndex(step: AgendaWalkInReceptionStep): number {
  if (step === 'specialty') return 0
  if (step === 'schedule_datetime') return 1
  if (step === 'photo') return 3
  if (step === 'success') return 4
  return 2
}

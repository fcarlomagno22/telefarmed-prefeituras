export type AgendaWalkInReceptionStep =
  | 'specialty'
  | 'schedule_datetime'
  | 'rh3_schedule_datetime'
  | 'cpf_lookup'
  | 'confirm_registration'
  | 'age_group'
  | 'registration'
  | 'contacts'
  | 'address'
  | 'photo'
  | 'registration_consent'
  | 'mt_waiting_room'
  | 'success'

export type WalkInReceptionFlowMode = 'mp' | 'mt_immediate' | 'mt_scheduled'

export const walkInReceptionFlowSteps = [
  { id: 'appointment', label: 'Especialidade e horário' },
  { id: 'register', label: 'CPF e cadastro' },
  { id: 'finish', label: 'Foto e fila' },
] as const

export function resolveWalkInReceptionStepIndex(step: AgendaWalkInReceptionStep): number {
  if (step === 'specialty' || step === 'schedule_datetime' || step === 'rh3_schedule_datetime') {
    return 0
  }
  if (step === 'photo' || step === 'success' || step === 'mt_waiting_room') return 2
  return 1
}

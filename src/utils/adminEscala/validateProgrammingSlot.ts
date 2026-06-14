import type { AdminEscalaProgrammingSlot } from '../../types/adminEscala'
import { normalizeProgrammingSlot, validateRepasseRule } from './repasseRule'

export { normalizeProgrammingSlot } from './repasseRule'

type ValidateProgrammingSlotOptions = {
  singleDayPeriod?: boolean
}

export function validateProgrammingSlot(
  slot: AdminEscalaProgrammingSlot,
  options?: ValidateProgrammingSlotOptions,
): string | null {
  const normalized = normalizeProgrammingSlot(slot)
  if (slot.dailyEnd <= slot.dailyStart) {
    return 'O horário final deve ser depois do inicial.'
  }
  if (!options?.singleDayPeriod && slot.weekdays.length === 0) {
    return 'Marque ao menos um dia da semana.'
  }
  if (slot.assignmentMode === 'assigned' && !slot.primaryDoctorId) {
    return 'Selecione o médico titular ou deixe o plantão aberto no portal.'
  }
  return validateRepasseRule(normalized.repasseRule, normalized.amountCents)
}

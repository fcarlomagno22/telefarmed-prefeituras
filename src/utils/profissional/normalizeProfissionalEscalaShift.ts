import type { ProfissionalEscalaDisponivel } from '../../types/profissionalEscalaDisponivel'
import { parseRepasseRuleFromApi } from '../adminEscala/repasseRule'

export function normalizeProfissionalEscalaShift(
  shift: ProfissionalEscalaDisponivel,
): ProfissionalEscalaDisponivel {
  return {
    ...shift,
    repasseRule: parseRepasseRuleFromApi(shift.repasseRule, shift.amountCents),
  }
}

export function normalizeProfissionalEscalaShifts(
  shifts: ProfissionalEscalaDisponivel[],
): ProfissionalEscalaDisponivel[] {
  return shifts.map((shift) => normalizeProfissionalEscalaShift(shift))
}

import type { AdminEscalaShift } from '../../types/adminEscala'

export function findPresencialShiftMissingAddress(
  shifts: AdminEscalaShift[],
): AdminEscalaShift | undefined {
  return shifts.find(
    (shift) =>
      shift.modality === 'presencial_ubt' &&
      (!shift.fullAddress?.trim() || !shift.unitName?.trim() || !shift.city?.trim()),
  )
}

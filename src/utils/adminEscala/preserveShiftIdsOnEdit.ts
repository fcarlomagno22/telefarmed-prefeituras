import type { AdminEscalaShift } from '../../types/adminEscala'

export function buildAdminEscalaShiftMatchKey(
  shift: Pick<AdminEscalaShift, 'startAt' | 'endAt' | 'specialty'>,
): string {
  return `${shift.startAt}|${shift.endAt}|${shift.specialty.trim().toLowerCase()}`
}

/** Preserva os IDs do banco ao republicar uma escala editada. */
export function preserveShiftIdsOnEdit(
  generated: AdminEscalaShift[],
  editingBatch: AdminEscalaShift[],
): AdminEscalaShift[] {
  const byKey = new Map<string, AdminEscalaShift>()
  for (const shift of editingBatch) {
    byKey.set(buildAdminEscalaShiftMatchKey(shift), shift)
  }

  return generated.map((shift) => {
    const existing = byKey.get(buildAdminEscalaShiftMatchKey(shift))
    if (!existing) return shift
    return {
      ...shift,
      id: existing.id,
      batchId: existing.batchId ?? shift.batchId,
      createdAt: existing.createdAt,
    }
  })
}

export function isUuid(value: string | undefined | null): value is string {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

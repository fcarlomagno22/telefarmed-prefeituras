import { buildProfissionalAgendaTourDemoShifts } from '../../data/profissionalAgendaTourMock'
import type { ProfissionalShift } from '../../types/profissionalAgenda'

export function mergeProfissionalAgendaTourDemoShifts(
  shifts: ProfissionalShift[],
  tourActive: boolean,
): ProfissionalShift[] {
  if (!tourActive) return shifts

  const merged = new Map(shifts.map((shift) => [shift.id, shift]))
  for (const demoShift of buildProfissionalAgendaTourDemoShifts()) {
    if (!merged.has(demoShift.id)) {
      merged.set(demoShift.id, demoShift)
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  )
}

export function mergeProfissionalAgendaTourShiftCountByDate(
  shiftCountByDate: Map<string, number>,
  shifts: ProfissionalShift[],
  tourActive: boolean,
): Map<string, number> {
  if (!tourActive) return shiftCountByDate

  const merged = new Map(shiftCountByDate)
  for (const shift of shifts) {
    const current = merged.get(shift.dateKey) ?? 0
    if (current <= 0) {
      merged.set(shift.dateKey, 1)
    }
  }
  return merged
}

import type { AdminEscalaProgrammingSlot } from '../../types/adminEscala'
import type { AdminEscalaWeekday } from './buildClosedSchedule'

export function resolveSingleScheduleWeekday(
  slots: AdminEscalaProgrammingSlot[],
  draftSlot?: AdminEscalaProgrammingSlot | null,
): AdminEscalaWeekday | null {
  const sources = slots.length > 0 ? slots : draftSlot ? [draftSlot] : []
  if (sources.length === 0) return null

  const union = new Set<AdminEscalaWeekday>()
  for (const slot of sources) {
    for (const day of slot.weekdays) {
      union.add(day)
    }
  }

  if (union.size !== 1) return null
  return [...union][0]!
}

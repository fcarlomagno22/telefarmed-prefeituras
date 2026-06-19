import type { AdminEscalaWeekday } from './buildClosedSchedule'
import { isSingleDayEscalaPeriod, parseDateOnly } from './dateRange'

/** Dias da semana (0=dom … 6=sáb) que ocorrem pelo menos uma vez no intervalo. */
export function resolveWeekdaysInDateRange(
  rangeStart: string,
  rangeEnd: string,
): AdminEscalaWeekday[] {
  if (isSingleDayEscalaPeriod(rangeStart, rangeEnd)) {
    const day = parseDateOnly(rangeStart)
    return day ? [day.getDay() as AdminEscalaWeekday] : []
  }

  const start = parseDateOnly(rangeStart)
  const end = parseDateOnly(rangeEnd)
  if (!start || !end || end < start) return []

  const found = new Set<AdminEscalaWeekday>()
  const cursor = new Date(start)
  while (cursor <= end) {
    found.add(cursor.getDay() as AdminEscalaWeekday)
    cursor.setDate(cursor.getDate() + 1)
  }

  return [...found].sort((a, b) => a - b) as AdminEscalaWeekday[]
}

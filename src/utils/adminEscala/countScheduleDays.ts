import type { AdminEscalaWeekday } from './buildClosedSchedule'
import { getEscalaRangeDaySpan, isSingleDayEscalaPeriod, parseDateOnly } from './dateRange'

export function countScheduleDaysInRange(
  rangeStart: string,
  rangeEnd: string,
  weekdays: AdminEscalaWeekday[],
): number {
  if (isSingleDayEscalaPeriod(rangeStart, rangeEnd)) {
    return 1
  }

  const start = parseDateOnly(rangeStart)
  const end = parseDateOnly(rangeEnd)
  if (!start || !end || end < start) {
    return 0
  }
  if (getEscalaRangeDaySpan(rangeStart, rangeEnd) === 0) {
    return 0
  }
  const weekdaySet = new Set(weekdays)
  let count = 0
  const cursor = new Date(start)
  while (cursor <= end) {
    if (weekdaySet.has(cursor.getDay() as AdminEscalaWeekday)) count += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

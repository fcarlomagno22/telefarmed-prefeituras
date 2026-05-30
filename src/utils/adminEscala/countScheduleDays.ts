import type { AdminEscalaWeekday } from './buildClosedSchedule'

function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function countScheduleDaysInRange(
  rangeStart: string,
  rangeEnd: string,
  weekdays: AdminEscalaWeekday[],
): number {
  const start = parseDateOnly(rangeStart)
  const end = parseDateOnly(rangeEnd)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
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

import type { AdminEscalaShift, AdminEscalaShiftStatus } from '../../types/adminEscala'
import { getEscalaRangeDaySpan, isSingleDayEscalaPeriod, parseDateOnly } from './dateRange'

export type AdminEscalaWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type BuildClosedScheduleInput = {
  template: Omit<
    AdminEscalaShift,
    'id' | 'startAt' | 'endAt' | 'createdAt' | 'updatedAt' | 'batchId'
  >
  rangeStart: string
  rangeEnd: string
  dailyStart: string
  dailyEnd: string
  weekdays: AdminEscalaWeekday[]
  batchId: string
  status: AdminEscalaShiftStatus
}

function parseTimeParts(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return { hours: hours ?? 0, minutes: minutes ?? 0 }
}

function toDateKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function countClosedScheduleDays(input: BuildClosedScheduleInput): number {
  return buildClosedScheduleShifts(input).length
}

export function buildClosedScheduleShifts(input: BuildClosedScheduleInput): AdminEscalaShift[] {
  const start = parseDateOnly(input.rangeStart)
  const end = parseDateOnly(input.rangeEnd)
  if (!start || !end || end < start || getEscalaRangeDaySpan(input.rangeStart, input.rangeEnd) === 0) {
    return []
  }

  const singleDay = isSingleDayEscalaPeriod(input.rangeStart, input.rangeEnd)
  const weekdaySet = new Set(input.weekdays)
  const { hours: startH, minutes: startM } = parseTimeParts(input.dailyStart)
  const { hours: endH, minutes: endM } = parseTimeParts(input.dailyEnd)
  const stamp = new Date().toISOString()
  const shifts: AdminEscalaShift[] = []

  const cursor = new Date(start)
  while (cursor <= end) {
    if (singleDay || weekdaySet.has(cursor.getDay() as AdminEscalaWeekday)) {
      const dayStart = new Date(cursor)
      dayStart.setHours(startH, startM, 0, 0)
      const dayEnd = new Date(cursor)
      dayEnd.setHours(endH, endM, 0, 0)
      if (dayEnd > dayStart) {
        const dateKey = toDateKey(cursor)
        shifts.push({
          ...input.template,
          id: `${input.batchId}-${dateKey}`,
          batchId: input.batchId,
          startAt: dayStart.toISOString(),
          endAt: dayEnd.toISOString(),
          status: input.status,
          createdAt: stamp,
          updatedAt: stamp,
        })
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return shifts
}

export const adminEscalaWeekdayOptions: { value: AdminEscalaWeekday; label: string; short: string }[] =
  [
    { value: 0, label: 'Domingo', short: 'Dom' },
    { value: 1, label: 'Segunda', short: 'Seg' },
    { value: 2, label: 'Terça', short: 'Ter' },
    { value: 3, label: 'Quarta', short: 'Qua' },
    { value: 4, label: 'Quinta', short: 'Qui' },
    { value: 5, label: 'Sexta', short: 'Sex' },
    { value: 6, label: 'Sábado', short: 'Sáb' },
  ]

export const defaultClosedWeekdays: AdminEscalaWeekday[] = [1, 2, 3, 4, 5]

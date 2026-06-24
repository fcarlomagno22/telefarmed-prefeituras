import type { MyRoutineDayHistoryEntry } from '../types/myRoutine'
import { getWeekStartIso } from './myRoutinePlanEngine'
import { formatWeekRangeLabel, shiftWeekStartIso } from './myRoutineWeekStats'
import { toLocalDateIso } from './runWalkWeeklyChart'

export type MyRoutineWeeklyHistoryPoint = {
  weekStartIso: string
  weekLabel: string
  minimalOkDays: number
  trackedDays: number
  adherencePercent: number
  lightDays: number
  entries: MyRoutineDayHistoryEntry[]
}

export function getWeekStartIsoForDate(dateIso: string): string {
  return getWeekStartIso(new Date(`${dateIso}T12:00:00`))
}

export function buildWeeklyHistorySeries(
  entries: MyRoutineDayHistoryEntry[],
  weeks = 4,
  referenceDate = new Date(),
): MyRoutineWeeklyHistoryPoint[] {
  const currentWeekStart = getWeekStartIso(referenceDate)
  const weekStarts = Array.from({ length: weeks }, (_, index) =>
    shiftWeekStartIso(currentWeekStart, -(weeks - 1 - index)),
  )

  const grouped = new Map<string, MyRoutineDayHistoryEntry[]>()
  for (const entry of entries) {
    const weekStart = getWeekStartIsoForDate(entry.dateIso)
    const bucket = grouped.get(weekStart) ?? []
    bucket.push(entry)
    grouped.set(weekStart, bucket)
  }

  return weekStarts.map((weekStartIso) => {
    const weekEntries = grouped.get(weekStartIso) ?? []
    let minimalOkDays = 0
    let lightDays = 0
    let adherenceSum = 0

    for (const entry of weekEntries) {
      if (entry.minimalTotal > 0 && entry.minimalDone >= entry.minimalTotal) {
        minimalOkDays += 1
      }
      if (entry.dayMode === 'light') lightDays += 1
      if (entry.minimalTotal > 0) {
        adherenceSum += entry.minimalDone / entry.minimalTotal
      }
    }

    const trackedDays = weekEntries.length
    const adherencePercent =
      trackedDays > 0 ? Math.round((adherenceSum / trackedDays) * 100) : 0

    return {
      weekStartIso,
      weekLabel: formatWeekRangeLabel(weekStartIso),
      minimalOkDays,
      trackedDays,
      adherencePercent,
      lightDays,
      entries: [...weekEntries].sort((a, b) => a.dateIso.localeCompare(b.dateIso)),
    }
  })
}

export function summarizeHistoryPoint(point: MyRoutineWeeklyHistoryPoint): string {
  if (point.trackedDays === 0) return 'Sem registros nesta semana'
  return `${point.minimalOkDays} dias com mínima ok · ${point.adherencePercent}% aderência`
}

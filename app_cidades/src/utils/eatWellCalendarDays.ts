import type { EatWellDailyRecord } from '../types/eatWell'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'
import { loadEatWellDailyRecord } from '../data/eatWellDailyStorage'

export type EatWellCalendarDay = {
  dateIso: string
  weekdayLabel: string
  dayNumber: number
  monthKey: string
  monthLabel: string
  isToday: boolean
  isFuture: boolean
  hasData?: boolean
  /** Verde / amarelo / vermelho na tela de cardápio */
  menuDotStatus?: 'complete' | 'partial' | 'none'
}

function formatMonthLabel(date: Date) {
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatMonthKey(year: number, monthIndex: number) {
  const month = String(monthIndex + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function parseMonthKey(monthKey: string) {
  const [yearRaw, monthRaw] = monthKey.split('-')
  const year = Number(yearRaw)
  const monthIndex = Number(monthRaw) - 1
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    const now = new Date()
    return { year: now.getFullYear(), monthIndex: now.getMonth() }
  }
  return { year, monthIndex }
}

export function getMonthKeyFromDateIso(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00`)
  if (Number.isNaN(date.getTime())) {
    return formatMonthKey(new Date().getFullYear(), new Date().getMonth())
  }
  return formatMonthKey(date.getFullYear(), date.getMonth())
}

export function getCurrentMonthKey(referenceDate = new Date()) {
  return formatMonthKey(referenceDate.getFullYear(), referenceDate.getMonth())
}

export function getEatWellMonthLabel(monthKey: string) {
  const { year, monthIndex } = parseMonthKey(monthKey)
  const date = new Date(year, monthIndex, 1, 12, 0, 0, 0)
  return formatMonthLabel(date)
}

export function getEatWellMonthLabelFromDateIso(dateIso: string) {
  return getEatWellMonthLabel(getMonthKeyFromDateIso(dateIso))
}

export function buildEatWellMonthDays(
  monthKey: string,
  referenceDate = new Date(),
): EatWellCalendarDay[] {
  const { year, monthIndex } = parseMonthKey(monthKey)
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const monthLabel = formatMonthLabel(new Date(year, monthIndex, 1, 12, 0, 0, 0))
  const key = formatMonthKey(year, monthIndex)

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1
    const date = new Date(year, monthIndex, dayNumber, 12, 0, 0, 0)
    const dateIso = toLocalDateIso(date)
    const weekdayLabel = date
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '')
      .slice(0, 3)
      .toUpperCase()

    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)

    return {
      dateIso,
      weekdayLabel,
      dayNumber,
      monthKey: key,
      monthLabel,
      isToday: dayStart.getTime() === today.getTime(),
      isFuture: dayStart.getTime() > today.getTime(),
    }
  })
}

/** @deprecated Use buildEatWellMonthDays */
export function buildEatWellCalendarDays(referenceDate = new Date()): EatWellCalendarDay[] {
  return buildEatWellMonthDays(getCurrentMonthKey(referenceDate), referenceDate)
}

export function getEatWellMonthLabelLegacy(dateIso: string) {
  return getEatWellMonthLabelFromDateIso(dateIso)
}

export async function loadEatWellCalendarDayFlags(
  patientCpf: string,
  days: EatWellCalendarDay[],
): Promise<Record<string, boolean>> {
  const flags: Record<string, boolean> = {}

  await Promise.all(
    days.map(async (day) => {
      const record = await loadEatWellDailyRecord(patientCpf, day.dateIso)
      flags[day.dateIso] = hasRecordData(record)
    }),
  )

  return flags
}

export function attachCalendarDayFlags(
  days: EatWellCalendarDay[],
  flags: Record<string, boolean>,
): EatWellCalendarDay[] {
  return days.map((day) => ({
    ...day,
    hasData: flags[day.dateIso] ?? false,
  }))
}

export function attachMenuCalendarDayStatuses(
  days: EatWellCalendarDay[],
  statuses: Record<string, 'complete' | 'partial' | 'none'>,
): EatWellCalendarDay[] {
  return days.map((day) => ({
    ...day,
    menuDotStatus: day.isFuture ? undefined : statuses[day.dateIso] ?? 'none',
  }))
}

export function hasRecordData(record: EatWellDailyRecord) {
  return record.meals.some((meal) => meal.entries.length > 0) || record.waterLogs.length > 0
}

export function pickDefaultDateIsoForMonth(monthKey: string, referenceDate = new Date()) {
  const todayIso = toLocalDateIso(referenceDate)
  if (getMonthKeyFromDateIso(todayIso) === monthKey) return todayIso

  const days = buildEatWellMonthDays(monthKey, referenceDate)
  const lastSelectable = [...days].reverse().find((day) => !day.isFuture)
  return lastSelectable?.dateIso ?? days[0]?.dateIso ?? todayIso
}

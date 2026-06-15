import { HydrationDayRecord } from '../types/hydration'
import { formatDateKey } from '../utils/metricsPeriod'

export const DEFAULT_HYDRATION_GOAL_ML = 2000

function seededNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function mlToLiters(ml: number) {
  return Number((ml / 1000).toFixed(2))
}

export function formatHydrationMl(ml: number) {
  return `${Math.round(ml).toLocaleString('pt-BR')} ml`
}

export function formatHydrationLiters(liters: number, decimals = 1) {
  return `${liters.toFixed(decimals).replace('.', ',')} L`
}

export function formatHydrationValue(ml: number) {
  if (ml >= 1000) {
    return formatHydrationLiters(ml / 1000)
  }
  return formatHydrationMl(ml)
}

export function formatHydrationDual(ml: number) {
  return `${formatHydrationLiters(ml / 1000)} (${formatHydrationMl(ml)})`
}

export function formatHydrationDateLabel(dateKey: string) {
  const date = startOfDay(new Date(`${dateKey}T12:00:00`))
  const today = startOfDay(new Date())
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000)

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'

  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function sortHydrationDays(records: HydrationDayRecord[]) {
  return [...records].sort((left, right) => right.date.localeCompare(left.date))
}

export function createExtendedMockHydrationHistory(days = 45): HydrationDayRecord[] {
  const records: HydrationDayRecord[] = []
  const today = startOfDay(new Date())

  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - dayOffset)
    const seed = dayOffset + 11
    const belowGoalBias = seededNoise(seed + 3) > 0.62
    const base = belowGoalBias ? 1250 : 2050
    const variance = Math.round((seededNoise(seed + 5) - 0.5) * 700)
    const totalMl = Math.max(600, Math.min(3400, base + variance))

    records.push({
      id: `hydration-${formatDateKey(date)}`,
      date: formatDateKey(date),
      totalMl,
    })
  }

  return sortHydrationDays(records)
}

export function appendHydrationLog(
  records: HydrationDayRecord[],
  amountMl: number,
  at: Date = new Date(),
): HydrationDayRecord[] {
  const dateKey = formatDateKey(at)
  const existing = records.find((record) => record.date === dateKey)

  if (existing) {
    return sortHydrationDays(
      records.map((record) =>
        record.date === dateKey
          ? { ...record, totalMl: record.totalMl + amountMl }
          : record,
      ),
    )
  }

  return sortHydrationDays([
    {
      id: `hydration-${dateKey}-${Date.now()}`,
      date: dateKey,
      totalMl: amountMl,
    },
    ...records,
  ])
}

export function getTodayHydrationRecord(records: HydrationDayRecord[]) {
  const today = formatDateKey(new Date())
  return records.find((record) => record.date === today) ?? null
}

export function getTodayHydrationLiters(records: HydrationDayRecord[], fallbackLiters = 0) {
  const today = getTodayHydrationRecord(records)
  if (!today) return fallbackLiters
  return mlToLiters(today.totalMl)
}

export function getTodayHydrationMl(records: HydrationDayRecord[]) {
  return getTodayHydrationRecord(records)?.totalMl ?? 0
}

export function isBelowHydrationGoal(totalMl: number, goalMl = DEFAULT_HYDRATION_GOAL_ML) {
  return totalMl < goalMl
}

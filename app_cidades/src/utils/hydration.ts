export const DEFAULT_HYDRATION_GOAL_ML = 2000

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

export function getTodayHydrationRecord(records: { date: string; totalMl: number }[]) {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayKey = `${year}-${month}-${day}`
  return records.find((record) => record.date === todayKey) ?? null
}

export function getTodayHydrationLiters(
  records: { date: string; totalMl: number }[],
  fallbackLiters = 0,
) {
  const today = getTodayHydrationRecord(records)
  if (!today) return fallbackLiters
  return mlToLiters(today.totalMl)
}

export function getTodayHydrationMl(records: { date: string; totalMl: number }[]) {
  return getTodayHydrationRecord(records)?.totalMl ?? 0
}

export function isBelowHydrationGoal(totalMl: number, goalMl = DEFAULT_HYDRATION_GOAL_ML) {
  return totalMl < goalMl
}

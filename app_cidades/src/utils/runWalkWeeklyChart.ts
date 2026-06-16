import type { WeeklyCalendarDay } from '../types/runWalk'

export function formatWeeklyChartDate(date: Date) {
  const day = date.getDate()
  const month = date
    .toLocaleDateString('pt-BR', { month: 'short' })
    .replace('.', '')
    .toLowerCase()
  return `${day}/${month}`
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function toDateIso(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export { toDateIso as toLocalDateIso }

export function buildWeeklyChartDays(calendarDays: WeeklyCalendarDay[]): WeeklyCalendarDay[] {
  const today = startOfDay(new Date())
  const weekday = today.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  const calendarByIso = new Map(calendarDays.map((day) => [day.dateIso, day]))

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + mondayOffset + index)

    const dateIso = toDateIso(date)
    const existing = calendarByIso.get(dateIso)
    const isToday = date.getTime() === today.getTime()
    const isFuture = date.getTime() > today.getTime()
    const weekdayShort = date
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '')
      .toLowerCase()

    return {
      dateIso,
      dayLabel:
        existing?.dayLabel ??
        date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
      weekdayShort,
      dateShort: formatWeeklyChartDate(date),
      isToday,
      isFuture,
      activeMinutes: isFuture ? 0 : (existing?.activeMinutes ?? 0),
      activities: existing?.activities ?? [{ type: 'rest', label: 'Descanso' }],
    }
  })
}

export function getWeeklyChartDaySummary(day: WeeklyCalendarDay) {
  if (day.isFuture) return 'Dia ainda não chegou'
  if (day.activeMinutes <= 0) return 'Nenhum minuto ativo'
  return `${day.activeMinutes} min ativos`
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b)
}

export function formatScheduleDayLabel(date: Date): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function getScheduleStartDate(): Date {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return today
}

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

export const SCHEDULE_DAY_COUNT = 31

export function getNextScheduleDays(count: number, fromDate: Date): Date[] {
  return Array.from({ length: count }, (_, index) => addDays(fromDate, index))
}

export function getScheduleEndDate(): Date {
  return addDays(getScheduleStartDate(), SCHEDULE_DAY_COUNT - 1)
}

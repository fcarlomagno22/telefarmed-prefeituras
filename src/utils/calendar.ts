export const CALENDAR_WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const

export const CALENDAR_MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

export type CalendarCell = {
  date: Date
  inCurrentMonth: boolean
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function buildCalendarGrid(viewDate: Date): CalendarCell[] {
  const monthStart = startOfMonth(viewDate)
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
  const leadingDays = (monthStart.getDay() + 6) % 7
  const totalCells = Math.ceil((leadingDays + monthEnd.getDate()) / 7) * 7

  return Array.from({ length: totalCells }, (_, index) => {
    const dayOffset = index - leadingDays
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1 + dayOffset)
    return {
      date,
      inCurrentMonth: date.getMonth() === viewDate.getMonth(),
    }
  })
}

export function formatDatePtBr(isoDate: string) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

/** Converte dd/mm/aaaa digitado para ISO (aaaa-mm-dd). Retorna vazio se incompleto ou inválido. */
export function parseBirthDateInput(masked: string): string {
  const digits = masked.replace(/\D/g, '')
  if (digits.length !== 8) return ''

  const day = Number(digits.slice(0, 2))
  const month = Number(digits.slice(2, 4))
  const year = Number(digits.slice(4, 8))

  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return ''

  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return ''
  }

  return toIsoDate(date)
}

export function parseIsoDate(isoDate: string): Date | null {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isDateWithinRange(date: Date, minDate?: Date, maxDate?: Date) {
  if (minDate && date < startOfDay(minDate)) return false
  if (maxDate && date > startOfDay(maxDate)) return false
  return true
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function buildYearRange(minDate: Date, maxDate: Date) {
  const years: number[] = []
  for (let year = maxDate.getFullYear(); year >= minDate.getFullYear(); year -= 1) {
    years.push(year)
  }
  return years
}

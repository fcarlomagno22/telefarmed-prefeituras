/** Limite operacional para montagem de escala (evita travamento com intervalos enormes). */
export const MAX_ESCALA_RANGE_DAYS = 366

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function parseDateOnly(value: string): Date | null {
  if (!DATE_INPUT_PATTERN.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return null
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

export function isCompleteDateInput(value: string): boolean {
  return parseDateOnly(value) !== null
}

export function getEscalaRangeDaySpan(rangeStart: string, rangeEnd: string): number {
  const start = parseDateOnly(rangeStart)
  const end = parseDateOnly(rangeEnd)
  if (!start || !end || end < start) return 0
  const ms = end.getTime() - start.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1
}

export function isSingleDayEscalaPeriod(rangeStart: string, rangeEnd: string): boolean {
  return (
    rangeStart === rangeEnd &&
    isCompleteDateInput(rangeStart) &&
    isCompleteDateInput(rangeEnd)
  )
}

export function isValidEscalaDateRange(rangeStart: string, rangeEnd: string): boolean {
  const span = getEscalaRangeDaySpan(rangeStart, rangeEnd)
  return span >= 1 && span <= MAX_ESCALA_RANGE_DAYS
}

export function escalaDateRangeError(rangeStart: string, rangeEnd: string): string | null {
  if (!rangeStart || !rangeEnd) {
    return 'Informe a data inicial e a data final.'
  }
  if (!isCompleteDateInput(rangeStart) || !isCompleteDateInput(rangeEnd)) {
    return 'Use datas válidas no formato correto.'
  }
  const span = getEscalaRangeDaySpan(rangeStart, rangeEnd)
  if (span === 0) {
    return 'A data final deve ser igual ou posterior à inicial.'
  }
  if (span > MAX_ESCALA_RANGE_DAYS) {
    return `O período máximo é de ${MAX_ESCALA_RANGE_DAYS} dias (~12 meses).`
  }
  return null
}

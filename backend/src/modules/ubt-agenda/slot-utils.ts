export const SLOT_INTERVAL_MINUTES = 20

const CLIMATE_START_HOUR = 7
const CLIMATE_END_HOUR = 19

export function parseTimeToMinutes(time: string): number {
  const match = /^(\d{2}):(\d{2})/.exec(time)
  if (!match) return 0
  return Number(match[1]) * 60 + Number(match[2])
}

export function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function formatHoraDisplay(hora: string): string {
  return formatMinutesToTime(parseTimeToMinutes(hora))
}

export function generateSlotTimes(horaInicio: string, horaFim: string): string[] {
  const start = parseTimeToMinutes(horaInicio)
  const end = parseTimeToMinutes(horaFim)
  const times: string[] = []

  for (let cursor = start; cursor + SLOT_INTERVAL_MINUTES <= end; cursor += SLOT_INTERVAL_MINUTES) {
    times.push(formatMinutesToTime(cursor))
  }

  return times
}

export function slotVisibleToUbt(
  escopoUbt: unknown,
  unidadeUbtId: string,
  modalidade: string,
): boolean {
  const scope =
    escopoUbt && typeof escopoUbt === 'object' && !Array.isArray(escopoUbt)
      ? (escopoUbt as { mode?: string; ubtIds?: string[] })
      : { mode: 'all' }

  if (scope.mode === 'tele_only' && modalidade === 'presencial_ubt') {
    return false
  }

  if (scope.mode === 'selected' && Array.isArray(scope.ubtIds)) {
    return scope.ubtIds.includes(unidadeUbtId)
  }

  return true
}

export function isTimeBlocked(
  time: string,
  blocks: Array<{ hora_inicio: string; hora_fim: string }>,
): boolean {
  const minutes = parseTimeToMinutes(time)
  return blocks.some((block) => {
    const start = parseTimeToMinutes(block.hora_inicio)
    const end = parseTimeToMinutes(block.hora_fim)
    return minutes >= start && minutes < end
  })
}

export function climateHours(): string[] {
  return Array.from(
    { length: CLIMATE_END_HOUR - CLIMATE_START_HOUR + 1 },
    (_, index) => `${String(CLIMATE_START_HOUR + index).padStart(2, '0')}h`,
  )
}

export function addDaysIso(isoDate: string, delta: number): string {
  const date = new Date(`${isoDate}T12:00:00`)
  date.setDate(date.getDate() + delta)
  return date.toISOString().slice(0, 10)
}

export function todayIsoInBrazil(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

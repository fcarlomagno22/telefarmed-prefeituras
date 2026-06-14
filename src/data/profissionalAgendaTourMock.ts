import {
  PROFISSIONAL_AGENDA_TOUR_DEMO_SHIFT_EXTRA_ID,
  PROFISSIONAL_AGENDA_TOUR_DEMO_SHIFT_ID,
  PROFISSIONAL_AGENDA_TOUR_DEMO_SHIFT_PM_ID,
} from '../config/profissionalAgendaTour'
import { PROFISSIONAL_TELEMEDICINE_LABEL } from '../config/profissionalConfig'
import type {
  ProfissionalShift,
  ProfissionalShiftLifecycle,
  ProfissionalShiftStats,
} from '../types/profissionalAgenda'
import { toDateKey } from '../utils/agendaDate'

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function buildDemoShift(input: {
  id: string
  dateKey: string
  startAt: Date
  endAt: Date
  turnLabel: string
  lifecycle: ProfissionalShiftLifecycle
  stats: ProfissionalShiftStats
}): ProfissionalShift {
  return {
    id: input.id,
    plantaoId: input.id.startsWith('prof-shift-')
      ? input.id.slice('prof-shift-'.length)
      : input.id,
    escalaShiftId: 'demo-001',
    dateKey: input.dateKey,
    municipality: 'São Paulo',
    ubtLabel: 'Telemedicina · Rede SP',
    specialty: 'Clínica Geral',
    turnLabel: input.turnLabel,
    startAt: input.startAt.toISOString(),
    endAt: input.endAt.toISOString(),
    startTime: formatTime(input.startAt),
    endTime: formatTime(input.endAt),
    role: 'titular',
    modality: 'tele',
    modalityLabel: PROFISSIONAL_TELEMEDICINE_LABEL,
    lifecycle: input.lifecycle,
    stats: input.stats,
  }
}

function resolveLifecycle(startAt: Date, endAt: Date, now: Date): ProfissionalShiftLifecycle {
  if (now < startAt) return 'aguardando_inicio'
  if (now > endAt) return 'encerrado'
  return 'em_andamento'
}

/** Plantões fictícios para o tour guiado da agenda (hoje, amanhã e mais um dia do mês). */
export function buildProfissionalAgendaTourDemoShifts(now = new Date()): ProfissionalShift[] {
  const todayKey = toDateKey(now)

  const startToday = new Date(now)
  startToday.setHours(Math.max(0, now.getHours() - 1), 0, 0, 0)
  const endToday = new Date(now)
  endToday.setHours(Math.min(23, now.getHours() + 5), 0, 0, 0)
  if (endToday <= startToday) {
    endToday.setTime(startToday.getTime() + 6 * 60 * 60 * 1000)
  }

  const mainShift = buildDemoShift({
    id: PROFISSIONAL_AGENDA_TOUR_DEMO_SHIFT_ID,
    dateKey: todayKey,
    startAt: startToday,
    endAt: endToday,
    turnLabel: 'Manhã · Turno A',
    lifecycle: resolveLifecycle(startToday, endToday, now),
    stats: { previstos: 8, naFila: 4, atendidos: 1, tempoMedioMin: 22 },
  })

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowKey = toDateKey(tomorrow)
  const startTomorrow = new Date(tomorrow)
  startTomorrow.setHours(14, 0, 0, 0)
  const endTomorrow = new Date(tomorrow)
  endTomorrow.setHours(20, 0, 0, 0)

  const tomorrowShift = buildDemoShift({
    id: PROFISSIONAL_AGENDA_TOUR_DEMO_SHIFT_PM_ID,
    dateKey: tomorrowKey,
    startAt: startTomorrow,
    endAt: endTomorrow,
    turnLabel: 'Tarde · Turno B',
    lifecycle: 'aguardando_inicio',
    stats: { previstos: 6, naFila: 0, atendidos: 0, tempoMedioMin: 0 },
  })

  const extraDay = new Date(now)
  extraDay.setDate(extraDay.getDate() + 4)
  const extraKey = toDateKey(extraDay)
  const startExtra = new Date(extraDay)
  startExtra.setHours(8, 0, 0, 0)
  const endExtra = new Date(extraDay)
  endExtra.setHours(14, 0, 0, 0)

  const extraShift = buildDemoShift({
    id: PROFISSIONAL_AGENDA_TOUR_DEMO_SHIFT_EXTRA_ID,
    dateKey: extraKey,
    startAt: startExtra,
    endAt: endExtra,
    turnLabel: 'Manhã · Turno C',
    lifecycle: 'aguardando_inicio',
    stats: { previstos: 5, naFila: 0, atendidos: 0, tempoMedioMin: 0 },
  })

  return [mainShift, tomorrowShift, extraShift]
}

export function isProfissionalAgendaTourDemoShiftId(shiftId: string): boolean {
  return (
    shiftId === PROFISSIONAL_AGENDA_TOUR_DEMO_SHIFT_ID ||
    shiftId === PROFISSIONAL_AGENDA_TOUR_DEMO_SHIFT_PM_ID ||
    shiftId === PROFISSIONAL_AGENDA_TOUR_DEMO_SHIFT_EXTRA_ID
  )
}

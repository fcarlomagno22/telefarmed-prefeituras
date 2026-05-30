import type { AdminEscalaFillStatus, AdminEscalaShift } from '../../types/adminEscala'
import type { ProfissionalEscalaTurn } from '../../types/profissionalEscalaDisponivel'
import { formatShiftTimeRange } from '../profissional/profissionalEscalaDisplay'
import { resolveTurnFromHour } from '../profissional/filterProfissionalEscalaDisponivel'

export function resolveTurnFromIsoStart(startAt: string): {
  turn: ProfissionalEscalaTurn
  turnLabel: string
} {
  const hour = new Date(startAt).getHours()
  const turn = resolveTurnFromHour(hour)
  const { turnLabel } = formatShiftTimeRange(startAt, startAt)
  return { turn, turnLabel: turnLabel || 'Turno' }
}

export function computeAdminEscalaFillStatus(shift: AdminEscalaShift): AdminEscalaFillStatus {
  if (shift.assignmentMode === 'assigned') return 'na'
  if (shift.status === 'cancelada' || shift.status === 'rascunho') return 'na'
  const filled = shift.totalVacancies - shift.vacancies
  if (shift.vacancies <= 0) return 'lotado'
  if (filled > 0) return 'parcial'
  return 'aberto'
}

export function enrichAdminEscalaShiftTiming(shift: Omit<AdminEscalaShift, 'turn' | 'turnLabel'> & {
  turn?: ProfissionalEscalaTurn
  turnLabel?: string
}): Pick<AdminEscalaShift, 'turn' | 'turnLabel'> {
  if (shift.turn && shift.turnLabel) {
    return { turn: shift.turn, turnLabel: shift.turnLabel }
  }
  return resolveTurnFromIsoStart(shift.startAt)
}

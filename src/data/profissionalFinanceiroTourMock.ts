import { PROFISSIONAL_FINANCEIRO_TOUR_DEMO_COMPETENCE_KEY } from '../config/profissionalFinanceiroTour'
import { PROFISSIONAL_TELEMEDICINE_LABEL } from '../config/profissionalConfig'
import type { ProfissionalBillingShift } from '../types/profissionalFinanceiro'

function isoLocal(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`
}

function tourShift(
  id: string,
  day: number,
  turnLabel: 'Manhã' | 'Tarde' | 'Noite',
  startHour: number,
  endHour: number,
  status: ProfissionalBillingShift['status'],
  escalaShiftId: string,
  attendedCount: number,
): ProfissionalBillingShift {
  const competenceKey = PROFISSIONAL_FINANCEIRO_TOUR_DEMO_COMPETENCE_KEY
  const [year, month] = competenceKey.split('-').map(Number)
  const startAt = isoLocal(year, month, day, startHour)
  const endAt = isoLocal(year, month, day, endHour)
  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const amountCents = 1_200_00

  return {
    id: `tour-bill-${id}`,
    escalaShiftId,
    competenceKey,
    dateKey,
    turnLabel,
    startAt,
    endAt,
    modalityLabel: PROFISSIONAL_TELEMEDICINE_LABEL,
    status,
    amountCents: status === 'cancelado' ? 0 : amountCents,
    attendedCount: status === 'realizado' ? attendedCount : 0,
  }
}

/** Plantões fictícios para o tour guiado do financeiro (competência aberta). */
export const profissionalFinanceiroTourDemoShifts: ProfissionalBillingShift[] = [
  tourShift('1', 3, 'Manhã', 8, 14, 'realizado', 'ESC-2026-0603-AM', 9),
  tourShift('2', 10, 'Tarde', 14, 20, 'realizado', 'ESC-2026-0610-PM', 11),
  tourShift('3', 17, 'Manhã', 8, 14, 'realizado', 'ESC-2026-0617-AM', 7),
  tourShift('4', 24, 'Tarde', 14, 20, 'previsto', 'ESC-2026-0624-PM', 0),
  tourShift('5', 28, 'Noite', 18, 0, 'previsto', 'ESC-2026-0628-NI', 0),
]

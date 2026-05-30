import {
  PROFISSIONAL_LOGGED_DOCTOR_ID,
  PROFISSIONAL_TELEMEDICINE_LABEL,
} from '../../config/profissionalConfig'
import { PROFISSIONAL_SHIFT_AMOUNT_CENTS } from '../../config/profissionalShiftRates'
import { adminEscalaShiftsInitial } from '../../data/adminEscalaMock'
import { profissionalFinanceiroSupplementalShifts } from '../../data/profissionalFinanceiroMock'
import type { AdminEscalaShift } from '../../types/adminEscala'
import type {
  ProfissionalBillingShift,
  ProfissionalBillingShiftStatus,
} from '../../types/profissionalFinanceiro'
import { toDateKey } from '../agendaDate'
import { formatProfissionalEscalaShiftId } from './formatProfissionalEscalaShiftId'
import { competenceKeyFromDate } from './profissionalCompetence'
import { formatShiftTimeRange } from './profissionalEscalaDisplay'

function doctorAssignedToShift(shift: AdminEscalaShift, doctorId: string): boolean {
  return shift.primaryDoctorId === doctorId || shift.backupDoctorIds.includes(doctorId)
}

function resolveBillingStatus(
  shift: AdminEscalaShift,
  now: Date,
): ProfissionalBillingShiftStatus {
  if (shift.status === 'cancelada') return 'cancelado'
  const end = new Date(shift.endAt)
  if (end <= now) return 'realizado'
  return 'previsto'
}

function mapEscalaShiftToBilling(shift: AdminEscalaShift, now: Date): ProfissionalBillingShift {
  const start = new Date(shift.startAt)
  const { turnLabel } = formatShiftTimeRange(shift.startAt, shift.endAt)
  const status = resolveBillingStatus(shift, now)

  return {
    id: `bill-${shift.id}`,
    escalaShiftId: formatProfissionalEscalaShiftId(shift.id),
    competenceKey: competenceKeyFromDate(start),
    dateKey: toDateKey(start),
    turnLabel,
    startAt: shift.startAt,
    endAt: shift.endAt,
    modalityLabel: PROFISSIONAL_TELEMEDICINE_LABEL,
    status,
    amountCents: status === 'cancelado' ? 0 : PROFISSIONAL_SHIFT_AMOUNT_CENTS,
    attendedCount: status === 'realizado' ? 8 + (shift.id.length % 6) : 0,
  }
}

export function buildProfissionalBillingShifts(
  doctorId: string = PROFISSIONAL_LOGGED_DOCTOR_ID,
  options?: { now?: Date },
): ProfissionalBillingShift[] {
  const now = options?.now ?? new Date()

  const fromEscala = adminEscalaShiftsInitial
    .filter((shift) => shift.status === 'publicada' || shift.status === 'cancelada')
    .filter((shift) => doctorAssignedToShift(shift, doctorId))
    .map((shift) => mapEscalaShiftToBilling(shift, now))

  const supplemental = profissionalFinanceiroSupplementalShifts.filter(
    (s) => s.doctorId === doctorId,
  )

  const merged = new Map<string, ProfissionalBillingShift>()
  for (const row of [...fromEscala, ...supplemental.map((s) => s.shift)]) {
    merged.set(row.id, row)
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  )
}

export function filterBillingShiftsByCompetence(
  shifts: ProfissionalBillingShift[],
  competenceKey: string,
): ProfissionalBillingShift[] {
  return shifts.filter((s) => s.competenceKey === competenceKey)
}

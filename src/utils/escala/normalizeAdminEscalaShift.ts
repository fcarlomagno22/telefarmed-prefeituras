import { PROFISSIONAL_SHIFT_AMOUNT_CENTS } from '../../config/profissionalShiftRates'
import { getUbtById } from '../../data/adminEscalaCatalog'
import type { AdminEscalaShift } from '../../types/adminEscala'
import { createDefaultRepasseRule } from '../adminEscala/repasseRule'
import { computeAdminEscalaFillStatus, enrichAdminEscalaShiftTiming } from './escalaShiftMeta'

export function defaultLocationForUbt(ubtId: string | undefined) {
  const ubt = ubtId ? getUbtById(ubtId) : undefined
  const city = ubt?.municipalityName ?? '—'
  return {
    unitName: ubt?.name ?? 'UBT',
    city,
    cityUf: `${city}`,
    fullAddress: ubt ? `${ubt.name}, ${city}` : null,
  }
}

export function normalizeAdminEscalaShift(raw: Partial<AdminEscalaShift> & Pick<AdminEscalaShift, 'id' | 'specialty' | 'modality' | 'startAt' | 'endAt' | 'prefeituraScope' | 'ubtScope' | 'status' | 'createdAt' | 'updatedAt'>): AdminEscalaShift {
  const assignmentMode =
    raw.assignmentMode ?? (raw.primaryDoctorId?.trim() ? 'assigned' : 'open')
  const ubtId = raw.ubtScope.mode === 'selected' ? raw.ubtScope.ubtIds[0] : undefined
  const loc = defaultLocationForUbt(ubtId)
  const totalVacancies =
    raw.totalVacancies ??
    (assignmentMode === 'open' ? Math.max(1, raw.vacancies ?? 1) : 0)
  const vacancies =
    assignmentMode === 'open'
      ? Math.max(0, raw.vacancies ?? totalVacancies)
      : 0

  const timing = enrichAdminEscalaShiftTiming(raw as AdminEscalaShift)

  const shift: AdminEscalaShift = {
    id: raw.id,
    batchId: raw.batchId,
    contratoEntidadeId: raw.contratoEntidadeId ?? null,
    contratoEntidadeIds: raw.contratoEntidadeIds ?? (raw.contratoEntidadeId ? [raw.contratoEntidadeId] : []),
    assignmentMode,
    primaryDoctorId: raw.primaryDoctorId ?? '',
    backupDoctorIds: raw.backupDoctorIds ?? [],
    specialtyId: raw.specialtyId,
    specialty: raw.specialty,
    modality: raw.modality,
    startAt: raw.startAt,
    endAt: raw.endAt,
    turn: timing.turn,
    turnLabel: timing.turnLabel,
    prefeituraScope: raw.prefeituraScope,
    ubtScope: raw.ubtScope,
    status: raw.status,
    vacancies,
    totalVacancies,
    amountCents: raw.amountCents ?? PROFISSIONAL_SHIFT_AMOUNT_CENTS,
    repasseRule:
      raw.repasseRule ??
      createDefaultRepasseRule(raw.amountCents ?? PROFISSIONAL_SHIFT_AMOUNT_CENTS),
    unitName: raw.unitName?.trim() || loc.unitName,
    city: raw.city?.trim() || loc.city,
    cityUf: raw.cityUf?.trim() || loc.cityUf,
    fullAddress:
      raw.modality === 'presencial_ubt'
        ? (raw.fullAddress ?? loc.fullAddress)
        : null,
    claimedCaptures: raw.claimedCaptures ?? [],
    notes: raw.notes ?? '',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    executionStatus: raw.executionStatus ?? 'na',
    realizadoCount: raw.realizadoCount ?? 0,
    confirmadoCount: raw.confirmadoCount ?? 0,
    totalPlantoes: raw.totalPlantoes ?? 0,
  }

  void computeAdminEscalaFillStatus(shift)
  return shift
}

export function normalizeAdminEscalaShifts(shifts: AdminEscalaShift[]): AdminEscalaShift[] {
  return shifts.map((s) => normalizeAdminEscalaShift(s))
}

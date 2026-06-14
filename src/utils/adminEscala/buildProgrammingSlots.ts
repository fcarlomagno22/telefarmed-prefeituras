import { getSpecialtyById } from '../../data/specialties'
import type {
  AdminEscalaPrefeituraScope,
  AdminEscalaProgrammingSlot,
  AdminEscalaShift,
  AdminEscalaShiftStatus,
  AdminEscalaUbtScope,
} from '../../types/adminEscala'
import { normalizeAdminEscalaShift } from '../escala/normalizeAdminEscalaShift'
import { buildClosedScheduleShifts } from './buildClosedSchedule'
import { normalizeProgrammingSlot, resolveSlotAmountCents } from './repasseRule'
import { countScheduleDaysInRange } from './countScheduleDays'
import { isValidEscalaDateRange } from './dateRange'

export type BuildProgrammingSlotsInput = {
  batchId: string
  rangeStart: string
  rangeEnd: string
  slots: AdminEscalaProgrammingSlot[]
  prefeituraScope: AdminEscalaPrefeituraScope
  ubtScope: AdminEscalaUbtScope
  status: AdminEscalaShiftStatus
}

export function countProgrammingSlotsShifts(input: BuildProgrammingSlotsInput): number {
  if (!isValidEscalaDateRange(input.rangeStart, input.rangeEnd)) return 0
  return input.slots.reduce(
    (total, slot) =>
      total + countScheduleDaysInRange(input.rangeStart, input.rangeEnd, slot.weekdays),
    0,
  )
}

export function buildProgrammingSlotsShifts(input: BuildProgrammingSlotsInput): AdminEscalaShift[] {
  if (!isValidEscalaDateRange(input.rangeStart, input.rangeEnd)) {
    return []
  }
  const all: AdminEscalaShift[] = []

  for (const rawSlot of input.slots) {
    const slot = normalizeProgrammingSlot(rawSlot)
    const specialty = getSpecialtyById(slot.specialtyId)?.name ?? 'Especialidade'
    const dayShifts = buildClosedScheduleShifts({
      batchId: input.batchId,
      rangeStart: input.rangeStart,
      rangeEnd: input.rangeEnd,
      dailyStart: slot.dailyStart,
      dailyEnd: slot.dailyEnd,
      weekdays: slot.weekdays,
      status: input.status,
      template: {
        assignmentMode: slot.assignmentMode,
        primaryDoctorId: slot.assignmentMode === 'open' ? '' : slot.primaryDoctorId,
        backupDoctorIds: slot.backupDoctorIds,
        specialty,
        specialtyId: slot.specialtyId,
        modality: slot.modality,
        prefeituraScope: input.prefeituraScope,
        ubtScope: input.ubtScope,
        vacancies: slot.assignmentMode === 'open' ? slot.vacancies : 0,
        totalVacancies: slot.assignmentMode === 'open' ? slot.vacancies : 0,
        amountCents: resolveSlotAmountCents(slot.amountCents, slot.repasseRule),
        repasseRule: slot.repasseRule,
        unitName: slot.unitName,
        city: slot.city,
        cityUf: slot.cityUf,
        fullAddress: slot.fullAddress,
        claimedCaptures: [],
        notes: slot.notes,
        status: input.status,
      },
    })

    for (const shift of dayShifts) {
      const dateKey = shift.startAt.slice(0, 10)
      all.push(
        normalizeAdminEscalaShift({
          ...shift,
          id: `${input.batchId}-${slot.id}-${dateKey}`,
        }),
      )
    }
  }

  return all.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
}

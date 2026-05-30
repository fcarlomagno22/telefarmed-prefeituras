import { getSpecialtyById } from '../../data/specialties'
import type { AdminEscalaShift, AdminEscalaShiftStatus } from '../../types/adminEscala'
import {
  buildClosedScheduleShifts,
  type AdminEscalaWeekday,
  type BuildClosedScheduleInput,
} from './buildClosedSchedule'

export type BuildPeriodEscalaInput = Omit<BuildClosedScheduleInput, 'template'> & {
  template: Omit<
    BuildClosedScheduleInput['template'],
    'specialty' | 'specialtyId'
  >
  specialtyIds: string[]
}

export function countPeriodEscalaShifts(input: BuildPeriodEscalaInput): number {
  return buildPeriodEscalaShifts(input).length
}

export function buildPeriodEscalaShifts(input: BuildPeriodEscalaInput): AdminEscalaShift[] {
  const specialtyIds =
    input.specialtyIds.length > 0 ? input.specialtyIds : ['']

  const all: AdminEscalaShift[] = []

  for (const specialtyId of specialtyIds) {
    const specialty = specialtyId ? getSpecialtyById(specialtyId)?.name ?? 'Especialidade' : 'Geral'
    const suffix = specialtyId || 'geral'
    const dayShifts = buildClosedScheduleShifts({
      ...input,
      batchId: input.batchId,
      template: {
        ...input.template,
        specialty,
        specialtyId: specialtyId || undefined,
      },
    })
    for (const shift of dayShifts) {
      const dateKey = shift.startAt.slice(0, 10)
      all.push({
        ...shift,
        id: `${input.batchId}-${suffix}-${dateKey}`,
      })
    }
  }

  return all.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
}

export type { AdminEscalaWeekday }

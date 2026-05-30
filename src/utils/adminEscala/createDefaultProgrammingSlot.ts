import { PROFISSIONAL_SHIFT_AMOUNT_CENTS } from '../../config/profissionalShiftRates'
import { getSpecialtyById } from '../../data/specialties'
import { adminEscalaDoctorOptions } from '../../data/adminEscalaMock'
import type { AdminEscalaProgrammingSlot } from '../../types/adminEscala'
import { defaultClosedWeekdays } from './buildClosedSchedule'

import { createProgrammingSlotId } from './programmingSlotId'

export function createDefaultProgrammingSlot(specialtyId: string): AdminEscalaProgrammingSlot {
  const specialtyName = getSpecialtyById(specialtyId)?.name
  const doctor =
    adminEscalaDoctorOptions.find(
      (d) => specialtyName && d.specialty.toLowerCase() === specialtyName.toLowerCase(),
    ) ?? adminEscalaDoctorOptions[0]

  return {
    id: createProgrammingSlotId(),
    specialtyId,
    dailyStart: '08:00',
    dailyEnd: '14:00',
    weekdays: [...defaultClosedWeekdays],
    modality: 'tele',
    assignmentMode: 'assigned',
    primaryDoctorId: doctor?.value ?? '1',
    backupDoctorIds: [],
    vacancies: 2,
    amountCents: PROFISSIONAL_SHIFT_AMOUNT_CENTS,
    unitName: 'UBT',
    city: 'Brasília',
    cityUf: 'Brasília / DF',
    fullAddress: null,
    notes: '',
  }
}

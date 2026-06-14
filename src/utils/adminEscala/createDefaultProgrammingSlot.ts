import { PROFISSIONAL_SHIFT_AMOUNT_CENTS } from '../../config/profissionalShiftRates'
import type { AdminEscalaProgrammingSlot } from '../../types/adminEscala'
import { createDefaultRepasseRule } from './repasseRule'
import { defaultClosedWeekdays } from './buildClosedSchedule'
import { getDoctorsForEscalaSpecialty } from './doctorsForSpecialty'
import { createProgrammingSlotId } from './programmingSlotId'

export function createDefaultProgrammingSlot(specialtyId: string): AdminEscalaProgrammingSlot {
  const doctors = getDoctorsForEscalaSpecialty(specialtyId)
  const doctor = doctors[0]

  return {
    id: createProgrammingSlotId(),
    specialtyId,
    dailyStart: '08:00',
    dailyEnd: '14:00',
    weekdays: [...defaultClosedWeekdays],
    modality: 'tele',
    assignmentMode: 'open',
    primaryDoctorId: doctor?.value ?? '',
    backupDoctorIds: [],
    vacancies: 1,
    amountCents: PROFISSIONAL_SHIFT_AMOUNT_CENTS,
    repasseRule: createDefaultRepasseRule(PROFISSIONAL_SHIFT_AMOUNT_CENTS),
    unitName: 'UBT',
    city: 'Brasília',
    cityUf: 'Brasília / DF',
    fullAddress: null,
    notes: '',
  }
}

import { getEscalaShifts } from './escalaSharedStore'
import { profissionalLoggedProfile } from './profissionalPerfilMock'
import { listProfissionalDisponivelFromAdminShifts } from '../utils/escala/adminEscalaToProfissional'
import { PROFISSIONAL_SHIFT_AMOUNT_CENTS } from '../config/profissionalShiftRates'

export const profissionalEscalaLoggedSpecialty = profissionalLoggedProfile.specialty

export const profissionalEscalaSpecialtyOptions = [
  { value: 'Clínica Médica', label: 'Clínica Médica' },
  { value: 'Clínico Geral', label: 'Clínico Geral' },
  { value: 'Pediatria', label: 'Pediatria' },
]

/** Plantões abertos publicados pelo admin (store compartilhada). */
export function getProfissionalEscalaDisponivelInitial() {
  return listProfissionalDisponivelFromAdminShifts(getEscalaShifts(), {
    forDoctorId: profissionalLoggedProfile.id,
  })
}

/** @deprecated Use getProfissionalEscalaDisponivelInitial — mantido para imports legados. */
export const profissionalEscalaDisponivelInitial = getProfissionalEscalaDisponivelInitial()

export const profissionalEscalaMonthlyStats = {
  claimedCount: 2,
  grossRevenueCents: 2 * PROFISSIONAL_SHIFT_AMOUNT_CENTS,
  acceptanceRatePercent: 94,
}

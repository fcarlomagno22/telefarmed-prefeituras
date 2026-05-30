import type { AdminEscalaShift } from '../../types/adminEscala'
import type { ProfissionalEscalaDisponivel } from '../../types/profissionalEscalaDisponivel'
import { profissionalLoggedProfile } from '../../data/profissionalPerfilMock'
import {
  adminModalityToProfissional,
  profissionalModalityLabelFromAdmin,
  profissionalPlantaoSubtitle,
} from './escalaModality'

export function adminShiftToProfissionalDisponivel(
  shift: AdminEscalaShift,
  options?: { forDoctorId?: string },
): ProfissionalEscalaDisponivel | null {
  if (shift.assignmentMode !== 'open') return null
  if (shift.status !== 'publicada') return null

  const profModality = adminModalityToProfissional(shift.modality)
  const reservedByMe = shift.claimedCaptures.some(
    (c) => c.doctorId === (options?.forDoctorId ?? profissionalLoggedProfile.id),
  )
  if (shift.vacancies <= 0 && !reservedByMe) return null

  return {
    id: shift.id,
    specialty: shift.specialty,
    startAt: shift.startAt,
    endAt: shift.endAt,
    turn: shift.turn,
    turnLabel: shift.turnLabel,
    modality: profModality,
    modalityLabel: profissionalModalityLabelFromAdmin(shift.modality),
    unitName: shift.unitName,
    municipalityName: shift.city,
    city: shift.city,
    cityUf: shift.cityUf,
    fullAddress: profModality === 'presencial' ? shift.fullAddress : null,
    distanceKm: null,
    amountCents: shift.amountCents,
    vacancies: shift.vacancies,
    status: reservedByMe ? 'reservado_mim' : 'disponivel',
    notes: shift.notes,
  }
}

export function listProfissionalDisponivelFromAdminShifts(
  shifts: AdminEscalaShift[],
  options?: { forDoctorId?: string },
): ProfissionalEscalaDisponivel[] {
  return shifts
    .map((s) => adminShiftToProfissionalDisponivel(s, options))
    .filter((s): s is ProfissionalEscalaDisponivel => s !== null)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
}

/** Subtítulo exibido na tabela profissional (exportado para admin preview). */
export { profissionalPlantaoSubtitle }

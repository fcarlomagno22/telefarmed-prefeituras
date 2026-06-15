import { specialties } from '../../data/specialties'
import { getAdminEscalaCatalog } from '../../data/adminEscalaCatalog'
import type { AdminEscalaShift } from '../../types/adminEscala'

export function resolveAdminEscalaSpecialtyId(shift: Pick<AdminEscalaShift, 'specialtyId' | 'specialty'>): string {
  const catalog = getAdminEscalaCatalog()
  const specialtyId = shift.specialtyId?.trim()

  if (specialtyId && catalog?.specialties.some((item) => item.id === specialtyId)) {
    return specialtyId
  }

  const fromCatalog = catalog?.specialties.find((item) => item.name === shift.specialty)?.id
  if (fromCatalog) return fromCatalog

  const fromStatic = specialties.find((item) => item.name === shift.specialty)?.id
  if (fromStatic) return fromStatic

  if (specialtyId) return specialtyId
  throw new Error(`Especialidade inválida: ${shift.specialty}`)
}

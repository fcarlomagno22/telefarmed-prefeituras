import { getSpecialtyById } from './specialties'
import { countSpecialtyAvailableSlotsOnDay, scheduleDoctors } from './scheduleDoctorsMock'
import { toDateKey } from '../utils/agendaDate'

/** Especialidades autorizadas no contrato UBT para triagem (espelha `triageServiceTypeSeeds`). */
export const triagemContratoEspecialidadeIds = [
  '4',
  '3',
  '7',
  '19',
  '33',
  '14',
  '18',
  '132',
] as const

export type TriagemEspecialidadeMock = {
  id: string
  name: string
  availableSlots: number
  available: boolean
}

function specialtyDisplayName(specialtyId: string): string {
  const fromCatalog = getSpecialtyById(specialtyId)?.name
  if (fromCatalog) return fromCatalog
  return scheduleDoctors.find((doctor) => doctor.specialtyId === specialtyId)?.specialtyName ?? specialtyId
}

function hashSeed(...parts: string[]): number {
  let hash = 0
  for (const part of parts) {
    for (let index = 0; index < part.length; index += 1) {
      hash = (hash * 31 + part.charCodeAt(index)) | 0
    }
  }
  return Math.abs(hash)
}

/** Vagas mínimas garantidas por especialidade em dias de demonstração. */
function guaranteedSlotsForDay(specialtyId: string, date: Date): number {
  const index = triagemContratoEspecialidadeIds.indexOf(
    specialtyId as (typeof triagemContratoEspecialidadeIds)[number],
  )
  if (index < 0) return 0
  const seed = hashSeed(specialtyId, toDateKey(date), 'triagem-slots')
  return 2 + (seed % 6)
}

/** Catálogo diário de especialidades com plantão e vagas livres para triagem. */
export function getTriagemEspecialidadesForDate(date: Date): TriagemEspecialidadeMock[] {
  return triagemContratoEspecialidadeIds.map((specialtyId) => {
    const catalog = getSpecialtyById(specialtyId)
    const computedSlots = countSpecialtyAvailableSlotsOnDay(specialtyId, date)
    const availableSlots = Math.max(computedSlots, guaranteedSlotsForDay(specialtyId, date))

    return {
      id: specialtyId,
      name: specialtyDisplayName(specialtyId),
      availableSlots,
      available: catalog?.available !== false && availableSlots > 0,
    }
  })
}

import type { ClienteSpecialtyOption } from '../../../hooks/useAdminClientesClinicoCatalog'

export type ClienteProfessionOption = {
  id: string
  name: string
  councilAcronym: string
}

export function filterSpecialtiesByProfessions(
  specialties: ClienteSpecialtyOption[],
  professionIds: Set<string>,
): ClienteSpecialtyOption[] {
  if (professionIds.size === 0) return []
  return specialties.filter((specialty) =>
    specialty.professionIds.some((professionId) => professionIds.has(professionId)),
  )
}

export function sortClienteCatalogItems<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

type ContratoSelectionForm = {
  professionIds: Set<string>
  specialtyIds: Set<string>
  precosProfissao: Record<string, string>
  precosEspecialidade: Record<string, string>
  excedentePrecosProfissao: Record<string, string>
  excedentePrecosEspecialidade: Record<string, string>
}

export function toggleProfessionInContratoForm<T extends ContratoSelectionForm>(
  current: T,
  professionId: string,
  allSpecialties: ClienteSpecialtyOption[],
): T {
  const nextProfessionIds = new Set(current.professionIds)
  const removing = nextProfessionIds.has(professionId)
  if (removing) {
    nextProfessionIds.delete(professionId)
  } else {
    nextProfessionIds.add(professionId)
  }

  const visibleIds = new Set(
    filterSpecialtiesByProfessions(allSpecialties, nextProfessionIds).map((item) => item.id),
  )

  const nextSpecialtyIds = new Set(
    [...current.specialtyIds].filter((specialtyId) => visibleIds.has(specialtyId)),
  )
  const precosProfissao = { ...current.precosProfissao }
  const excedentePrecosProfissao = { ...current.excedentePrecosProfissao }
  const precosEspecialidade = { ...current.precosEspecialidade }
  const excedentePrecosEspecialidade = { ...current.excedentePrecosEspecialidade }

  if (removing) {
    delete precosProfissao[professionId]
    delete excedentePrecosProfissao[professionId]
  }

  for (const specialtyId of current.specialtyIds) {
    if (!visibleIds.has(specialtyId)) {
      delete precosEspecialidade[specialtyId]
      delete excedentePrecosEspecialidade[specialtyId]
    }
  }

  return {
    ...current,
    professionIds: nextProfessionIds,
    specialtyIds: nextSpecialtyIds,
    precosProfissao,
    excedentePrecosProfissao,
    precosEspecialidade,
    excedentePrecosEspecialidade,
  }
}

export function selectAllVisibleSpecialties<T extends ContratoSelectionForm>(
  current: T,
  visibleSpecialties: ClienteSpecialtyOption[],
): T {
  return {
    ...current,
    specialtyIds: new Set(visibleSpecialties.map((item) => item.id)),
  }
}

export function clearAllSpecialtySelection<T extends ContratoSelectionForm>(current: T): T {
  return {
    ...current,
    specialtyIds: new Set(),
    precosEspecialidade: {},
    excedentePrecosEspecialidade: {},
  }
}

export function setSpecialtiesSelectionForProfession<T extends ContratoSelectionForm>(
  current: T,
  specialtyIdsToUpdate: string[],
  selected: boolean,
): T {
  const nextSpecialtyIds = new Set(current.specialtyIds)
  const precosEspecialidade = { ...current.precosEspecialidade }
  const excedentePrecosEspecialidade = { ...current.excedentePrecosEspecialidade }

  for (const specialtyId of specialtyIdsToUpdate) {
    if (selected) {
      nextSpecialtyIds.add(specialtyId)
    } else {
      nextSpecialtyIds.delete(specialtyId)
      delete precosEspecialidade[specialtyId]
      delete excedentePrecosEspecialidade[specialtyId]
    }
  }

  return {
    ...current,
    specialtyIds: nextSpecialtyIds,
    precosEspecialidade,
    excedentePrecosEspecialidade,
  }
}

export function areAllSpecialtiesSelected(
  specialtyIds: Set<string>,
  groupSpecialtyIds: string[],
): boolean {
  return (
    groupSpecialtyIds.length > 0 && groupSpecialtyIds.every((specialtyId) => specialtyIds.has(specialtyId))
  )
}

import type { ClienteSpecialtyOption } from '../../../hooks/useAdminClientesClinicoCatalog'
import type { ContratoOrigemAtendimento } from '../../../config/adminContratoOrigemAtendimento'
import { defaultContratoOrigemAtendimento } from '../../../config/adminContratoOrigemAtendimento'

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
  origemAtendimentoProfissao: Record<string, ContratoOrigemAtendimento>
  origemAtendimentoEspecialidade: Record<string, ContratoOrigemAtendimento>
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
  const origemAtendimentoProfissao = { ...current.origemAtendimentoProfissao }
  const origemAtendimentoEspecialidade = { ...current.origemAtendimentoEspecialidade }

  if (removing) {
    delete precosProfissao[professionId]
    delete excedentePrecosProfissao[professionId]
    delete origemAtendimentoProfissao[professionId]
  } else {
    origemAtendimentoProfissao[professionId] =
      origemAtendimentoProfissao[professionId] ?? defaultContratoOrigemAtendimento()
  }

  for (const specialtyId of current.specialtyIds) {
    if (!visibleIds.has(specialtyId)) {
      delete precosEspecialidade[specialtyId]
      delete excedentePrecosEspecialidade[specialtyId]
      delete origemAtendimentoEspecialidade[specialtyId]
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
    origemAtendimentoProfissao,
    origemAtendimentoEspecialidade,
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
    origemAtendimentoEspecialidade: {},
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
  const origemAtendimentoEspecialidade = { ...current.origemAtendimentoEspecialidade }

  for (const specialtyId of specialtyIdsToUpdate) {
    if (selected) {
      nextSpecialtyIds.add(specialtyId)
      origemAtendimentoEspecialidade[specialtyId] =
        origemAtendimentoEspecialidade[specialtyId] ?? defaultContratoOrigemAtendimento()
    } else {
      nextSpecialtyIds.delete(specialtyId)
      delete precosEspecialidade[specialtyId]
      delete excedentePrecosEspecialidade[specialtyId]
      delete origemAtendimentoEspecialidade[specialtyId]
    }
  }

  return {
    ...current,
    specialtyIds: nextSpecialtyIds,
    precosEspecialidade,
    excedentePrecosEspecialidade,
    origemAtendimentoEspecialidade,
  }
}

export function toggleSpecialtyInContratoForm<T extends ContratoSelectionForm>(
  current: T,
  specialtyId: string,
): T {
  const next = new Set(current.specialtyIds)
  const precosEspecialidade = { ...current.precosEspecialidade }
  const excedentePrecosEspecialidade = { ...current.excedentePrecosEspecialidade }
  const origemAtendimentoEspecialidade = { ...current.origemAtendimentoEspecialidade }

  if (next.has(specialtyId)) {
    next.delete(specialtyId)
    delete precosEspecialidade[specialtyId]
    delete excedentePrecosEspecialidade[specialtyId]
    delete origemAtendimentoEspecialidade[specialtyId]
  } else {
    next.add(specialtyId)
    origemAtendimentoEspecialidade[specialtyId] =
      origemAtendimentoEspecialidade[specialtyId] ?? defaultContratoOrigemAtendimento()
  }

  return {
    ...current,
    specialtyIds: next,
    precosEspecialidade,
    excedentePrecosEspecialidade,
    origemAtendimentoEspecialidade,
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

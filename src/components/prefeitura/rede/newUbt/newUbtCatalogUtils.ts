import type { ConfigProfession, ConfigSpecialty } from '../../../../types/adminConfiguracoes'
import type { NewUbtFormState } from './newUbtFormTypes'

export function sortCatalogByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function getSpecialtiesForProfession(
  specialties: ConfigSpecialty[],
  professionId: string,
): ConfigSpecialty[] {
  return specialties.filter((item) => item.professionIds.includes(professionId))
}

export function getVisibleSpecialtiesForUbtForm(
  specialties: ConfigSpecialty[],
  professionIds: Set<string>,
): ConfigSpecialty[] {
  if (professionIds.size === 0) return []
  return specialties.filter((specialty) =>
    specialty.professionIds.some((professionId) => professionIds.has(professionId)),
  )
}

export function groupSpecialtiesBySelectedProfessions(
  specialties: ConfigSpecialty[],
  professionIds: Set<string>,
  professions: ConfigProfession[],
) {
  return professions
    .filter((profession) => professionIds.has(profession.id))
    .map((profession) => ({
      profession,
      specialties: getSpecialtiesForProfession(specialties, profession.id),
    }))
}

export function toggleProfessionInUbtForm(
  form: NewUbtFormState,
  professionId: string,
  allSpecialties: ConfigSpecialty[],
): NewUbtFormState {
  const nextProfessionIds = new Set(form.professionIds)
  const removing = nextProfessionIds.has(professionId)
  if (removing) nextProfessionIds.delete(professionId)
  else nextProfessionIds.add(professionId)

  const visibleIds = new Set(
    getVisibleSpecialtiesForUbtForm(allSpecialties, nextProfessionIds).map((item) => item.id),
  )
  const nextSpecialtyIds = new Set(
    [...form.specialtyIds].filter((specialtyId) => visibleIds.has(specialtyId)),
  )

  return {
    ...form,
    professionIds: nextProfessionIds,
    specialtyIds: nextSpecialtyIds,
  }
}

export function selectAllVisibleUbtSpecialties(
  form: NewUbtFormState,
  visibleSpecialties: ConfigSpecialty[],
): NewUbtFormState {
  return {
    ...form,
    specialtyIds: new Set(visibleSpecialties.map((item) => item.id)),
  }
}

export function validateUbtProfessionsAndSpecialties(
  form: NewUbtFormState,
  professions: ConfigProfession[],
  specialties: ConfigSpecialty[],
): string | null {
  if (form.professionIds.size === 0) {
    return 'Selecione ao menos uma profissão.'
  }

  for (const professionId of form.professionIds) {
    const profession = professions.find((item) => item.id === professionId)
    const catalogSpecialties = getSpecialtiesForProfession(specialties, professionId)
    if (catalogSpecialties.length === 0) continue

    const hasSelected = catalogSpecialties.some((item) => form.specialtyIds.has(item.id))
    if (!hasSelected) {
      return `Selecione ao menos uma especialidade de ${profession?.name ?? 'profissão'}.`
    }
  }

  return null
}

export function buildUbtEspecialidadeNames(
  form: NewUbtFormState,
  professions: ConfigProfession[],
  specialties: ConfigSpecialty[],
): string[] {
  const names = new Set<string>()

  for (const professionId of form.professionIds) {
    const profession = professions.find((item) => item.id === professionId)
    if (!profession) continue

    const selectedSpecialties = getSpecialtiesForProfession(specialties, professionId).filter((item) =>
      form.specialtyIds.has(item.id),
    )

    if (selectedSpecialties.length > 0) {
      for (const specialty of selectedSpecialties) {
        names.add(specialty.name)
      }
      continue
    }

    const catalogSpecialties = getSpecialtiesForProfession(specialties, professionId)
    if (catalogSpecialties.length === 0) {
      names.add(profession.name)
    }
  }

  return sortCatalogByName([...names].map((name) => ({ name }))).map((item) => item.name)
}

export function getSelectedProfessionNames(
  form: NewUbtFormState,
  professions: ConfigProfession[],
): string[] {
  return sortCatalogByName(
    professions.filter((item) => form.professionIds.has(item.id)),
  ).map((item) => item.name)
}

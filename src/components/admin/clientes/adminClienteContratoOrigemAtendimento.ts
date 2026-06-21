import type {
  ContratoOrigemAtendimento,
  MedicoProfessionRef,
} from '../../../config/adminContratoOrigemAtendimento'
import {
  defaultContratoOrigemAtendimento,
  isMedicoProfession,
  isMedicoProfessionId,
} from '../../../config/adminContratoOrigemAtendimento'
import type { ClienteSpecialtyOption } from '../../../hooks/useAdminClientesClinicoCatalog'
import { resolvePrimaryProfessionIdForSpecialty } from './adminClienteContratoPricing'

export type ContratoOrigemAtendimentoFormSlice = {
  professionIds: Set<string>
  specialtyIds: Set<string>
  origemAtendimentoProfissao: Record<string, ContratoOrigemAtendimento>
  origemAtendimentoEspecialidade: Record<string, ContratoOrigemAtendimento>
}

export function createEmptyContratoOrigemAtendimentoMaps(): {
  origemAtendimentoProfissao: Record<string, ContratoOrigemAtendimento>
  origemAtendimentoEspecialidade: Record<string, ContratoOrigemAtendimento>
} {
  return {
    origemAtendimentoProfissao: {},
    origemAtendimentoEspecialidade: {},
  }
}

function medicoProfessionIds(professions: MedicoProfessionRef[]): Set<string> {
  return new Set(professions.filter(isMedicoProfession).map((item) => item.id))
}

export function specialtyUsesMedicoOrigemToggle(
  specialty: ClienteSpecialtyOption,
  professionIds: Set<string>,
  professions: MedicoProfessionRef[] = [],
): boolean {
  const medicoIds = medicoProfessionIds(professions)
  const hasSelectedMedicoProfession = [...professionIds].some((id) => isMedicoProfessionId(id, professions))
  if (!hasSelectedMedicoProfession) return false

  return specialty.professionIds.some((id) => medicoIds.has(id) || isMedicoProfessionId(id, professions))
}

export function resolveSpecialtyOrigemAtendimentoForForm(
  form: ContratoOrigemAtendimentoFormSlice,
  specialty: ClienteSpecialtyOption,
  professions: MedicoProfessionRef[] = [],
): ContratoOrigemAtendimento {
  if (specialtyUsesMedicoOrigemToggle(specialty, form.professionIds, professions)) {
    return form.origemAtendimentoEspecialidade[specialty.id] ?? defaultContratoOrigemAtendimento()
  }

  const professionId = resolvePrimaryProfessionIdForSpecialty(specialty, form.professionIds)
  if (!professionId) return defaultContratoOrigemAtendimento()
  return form.origemAtendimentoProfissao[professionId] ?? defaultContratoOrigemAtendimento()
}

export function buildOrigemAtendimentoEspecialidadesPayload(
  form: ContratoOrigemAtendimentoFormSlice,
  specialties: ClienteSpecialtyOption[],
  professions: MedicoProfessionRef[] = [],
): { specialtyId: string; origem: ContratoOrigemAtendimento }[] {
  const specialtyById = new Map(specialties.map((item) => [item.id, item]))

  return [...form.specialtyIds].map((specialtyId) => {
    const specialty = specialtyById.get(specialtyId)
    const origem = specialty
      ? resolveSpecialtyOrigemAtendimentoForForm(form, specialty, professions)
      : form.origemAtendimentoEspecialidade[specialtyId] ?? defaultContratoOrigemAtendimento()

    return { specialtyId, origem }
  })
}

export function buildOrigemAtendimentoProfissoesPayload(
  form: ContratoOrigemAtendimentoFormSlice,
  professions: MedicoProfessionRef[] = [],
): { professionId: string; origem: ContratoOrigemAtendimento }[] {
  return [...form.professionIds]
    .filter((professionId) => !isMedicoProfessionId(professionId, professions))
    .map((professionId) => ({
      professionId,
      origem: form.origemAtendimentoProfissao[professionId] ?? defaultContratoOrigemAtendimento(),
    }))
}

export function hydrateContratoOrigemAtendimentoFromDetalhes(input: {
  specialtyIds: Set<string>
  professionIds: Set<string>
  precosPorProfissao: { professionId: string; origemAtendimento?: ContratoOrigemAtendimento }[]
  precosPorEspecialidade: { specialtyId: string; origemAtendimento?: ContratoOrigemAtendimento }[]
  specialties: ClienteSpecialtyOption[]
  professions?: MedicoProfessionRef[]
}): {
  origemAtendimentoProfissao: Record<string, ContratoOrigemAtendimento>
  origemAtendimentoEspecialidade: Record<string, ContratoOrigemAtendimento>
} {
  const professions = input.professions ?? []
  const origemAtendimentoProfissao: Record<string, ContratoOrigemAtendimento> = {}
  const origemAtendimentoEspecialidade: Record<string, ContratoOrigemAtendimento> = {}

  for (const item of input.precosPorProfissao) {
    if (!input.professionIds.has(item.professionId)) continue
    if (isMedicoProfessionId(item.professionId, professions)) continue
    origemAtendimentoProfissao[item.professionId] =
      item.origemAtendimento ?? defaultContratoOrigemAtendimento()
  }

  const specialtyById = new Map(input.specialties.map((item) => [item.id, item]))
  for (const specialtyId of input.specialtyIds) {
    const fromPrice = input.precosPorEspecialidade.find((item) => item.specialtyId === specialtyId)
      ?.origemAtendimento
    const specialty = specialtyById.get(specialtyId)
    if (specialty && specialtyUsesMedicoOrigemToggle(specialty, input.professionIds, professions)) {
      origemAtendimentoEspecialidade[specialtyId] =
        fromPrice ?? defaultContratoOrigemAtendimento()
    }
  }

  return { origemAtendimentoProfissao, origemAtendimentoEspecialidade }
}

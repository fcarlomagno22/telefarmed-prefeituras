import { getAdminEscalaSpecialties } from '../../data/adminEscalaCatalog'
import type { EscalaContratoOptionApi } from '../../lib/services/admin/escala'

/** União das especialidades autorizadas nos contratos selecionados. */
export function buildSpecialtyOptionsFromContratos(
  contratoIds: string[],
  contratosById: Record<string, EscalaContratoOptionApi>,
): { value: string; label: string }[] {
  const authorizedIds = new Set<string>()

  for (const contratoId of contratoIds) {
    const contrato = contratosById[contratoId]
    if (!contrato) continue
    for (const specialtyId of contrato.especialidadesAutorizadas ?? []) {
      authorizedIds.add(specialtyId)
    }
  }

  if (authorizedIds.size === 0) return []

  return getAdminEscalaSpecialties()
    .filter((specialty) => specialty.active && authorizedIds.has(specialty.id))
    .map((specialty) => ({ value: specialty.id, label: specialty.name }))
}

export function registerContratosById(
  current: Record<string, EscalaContratoOptionApi>,
  contratos: EscalaContratoOptionApi[],
): Record<string, EscalaContratoOptionApi> {
  if (contratos.length === 0) return current
  const next = { ...current }
  for (const contrato of contratos) {
    next[contrato.id] = contrato
  }
  return next
}

import type { ClienteSpecialtyOption } from '../../../hooks/useAdminClientesClinicoCatalog'

export type ContratoPricingFormSlice = {
  professionIds: Set<string>
  specialtyIds: Set<string>
  precosProfissao: Record<string, string>
  precosEspecialidade: Record<string, string>
  excedentePrecosProfissao: Record<string, string>
  excedentePrecosEspecialidade: Record<string, string>
}

export function parseCurrencyBrl(value: string) {
  const normalized = value.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function hasPositiveCurrency(value: string) {
  return parseCurrencyBrl(value) > 0
}

export function resolvePrimaryProfessionIdForSpecialty(
  specialty: ClienteSpecialtyOption,
  selectedProfessionIds: Set<string>,
): string | null {
  for (const professionId of specialty.professionIds) {
    if (selectedProfessionIds.has(professionId)) return professionId
  }
  return null
}

function resolveEffectivePriceFromProfessions(
  form: ContratoPricingFormSlice,
  specialty: ClienteSpecialtyOption,
  specialtyPrice: string,
  professionPrices: Record<string, string>,
): number {
  if (hasPositiveCurrency(specialtyPrice)) {
    return parseCurrencyBrl(specialtyPrice)
  }

  for (const professionId of specialty.professionIds) {
    if (!form.professionIds.has(professionId)) continue
    const professionPrice = professionPrices[professionId] ?? ''
    if (hasPositiveCurrency(professionPrice)) {
      return parseCurrencyBrl(professionPrice)
    }
  }

  return 0
}

export function resolveEffectiveConsultaPreco(
  form: ContratoPricingFormSlice,
  specialty: ClienteSpecialtyOption,
): number {
  return resolveEffectivePriceFromProfessions(
    form,
    specialty,
    form.precosEspecialidade[specialty.id] ?? '',
    form.precosProfissao,
  )
}

export function resolveEffectiveExcedentePreco(
  form: ContratoPricingFormSlice,
  specialty: ClienteSpecialtyOption,
): number {
  return resolveEffectivePriceFromProfessions(
    form,
    specialty,
    form.excedentePrecosEspecialidade[specialty.id] ?? '',
    form.excedentePrecosProfissao,
  )
}

export function specialtyUsesProfessionConsultaDefault(
  form: ContratoPricingFormSlice,
  specialty: ClienteSpecialtyOption,
): boolean {
  const specialtyPrice = form.precosEspecialidade[specialty.id] ?? ''
  if (hasPositiveCurrency(specialtyPrice)) return false
  const professionId = resolvePrimaryProfessionIdForSpecialty(specialty, form.professionIds)
  if (!professionId) return false
  return hasPositiveCurrency(form.precosProfissao[professionId] ?? '')
}

export function groupSpecialtiesBySelectedProfessions(
  specialties: ClienteSpecialtyOption[],
  professionIds: Set<string>,
  professions: Array<{ id: string; name: string }>,
) {
  const visible = specialties.filter((specialty) =>
    specialty.professionIds.some((professionId) => professionIds.has(professionId)),
  )

  return professions
    .filter((profession) => professionIds.has(profession.id))
    .map((profession) => ({
      profession,
      specialties: visible.filter((specialty) => specialty.professionIds.includes(profession.id)),
    }))
    .filter((group) => group.specialties.length > 0)
}

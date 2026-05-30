import type { MedicoCadastroFormValues } from '../../types/medicoCadastro'

/** Texto único para perfil / exibição (mesmo padrão do mock de perfil). */
export function formatMedicoCadastroProfessionalAddress(
  values: Pick<
    MedicoCadastroFormValues,
    'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'zipCode'
  >,
): string {
  const line1 = [values.street.trim(), values.number.trim()].filter(Boolean).join(', ')
  const line2 = values.complement.trim()
  const line3 = [values.neighborhood.trim(), values.city.trim()].filter(Boolean).join(', ')
  const uf = values.state.trim()
  const cep = values.zipCode.replace(/\D/g, '')
  const cepFormatted =
    cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : values.zipCode.trim()

  const cityUf = [line3, uf].filter(Boolean).join(' - ')
  const parts = [line1, line2, cityUf, cepFormatted ? `CEP ${cepFormatted}` : '']
    .map((part) => part.trim())
    .filter(Boolean)

  return parts.join(', ')
}

export type ViaCepAddress = {
  cep: string
  street: string
  neighborhood: string
  city: string
  state: string
  complement: string
  ibgeMunicipalityCode?: string
}

type ViaCepResponse = {
  erro?: boolean
  cep?: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  complemento?: string
  ibge?: string
}

export function normalizeCepDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidCepDigits(digits: string): boolean {
  return digits.length === 8 && /^\d{8}$/.test(digits)
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepAddress | null> {
  const digits = normalizeCepDigits(cep)
  if (!isValidCepDigits(digits)) return null

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null

    const data = (await response.json()) as ViaCepResponse
    if (data.erro) return null

    const city = data.localidade?.trim() ?? ''
    const state = data.uf?.trim() ?? ''
    if (!city || !state) return null

    const ibge = data.ibge?.trim()
    return {
      cep: digits,
      street: data.logradouro?.trim() ?? '',
      neighborhood: data.bairro?.trim() ?? '',
      city,
      state,
      complement: data.complemento?.trim() ?? '',
      ...(ibge ? { ibgeMunicipalityCode: ibge } : {}),
    }
  } catch {
    return null
  }
}

export type MunicipalityClientResult =
  | {
      isClient: true
      municipality: string
      uf: string
      contractActive: true
    }
  | {
      isClient: false
      municipality?: string
      uf?: string
    }

const CLIENT_CEPS = new Set(['01227000'])
const NON_CLIENT_CEPS = new Set(['15800105'])

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function checkMunicipalityClientByCep(
  cep: string,
  city?: string,
  uf?: string,
): Promise<MunicipalityClientResult> {
  await delay(900)

  const digits = cep.replace(/\D/g, '')

  if (CLIENT_CEPS.has(digits)) {
    return {
      isClient: true,
      municipality: city?.trim() || 'São Paulo',
      uf: uf?.trim() || 'SP',
      contractActive: true,
    }
  }

  if (NON_CLIENT_CEPS.has(digits)) {
    return {
      isClient: false,
      municipality: city?.trim(),
      uf: uf?.trim(),
    }
  }

  return {
    isClient: false,
    municipality: city?.trim(),
    uf: uf?.trim(),
  }
}

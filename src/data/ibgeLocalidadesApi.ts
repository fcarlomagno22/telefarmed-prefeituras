export type SelectOption = {
  value: string
  label: string
}

const IBGE_BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades'

function normalizeUf(uf: string) {
  return uf.trim().toUpperCase()
}

/**
 * Estados brasileiros (UF) via IBGE.
 * Endpoint: GET /estados
 */
export async function fetchIbgeStates(signal?: AbortSignal): Promise<SelectOption[]> {
  const res = await fetch(`${IBGE_BASE}/estados`, { signal })
  if (!res.ok) throw new Error(`IBGE estados falhou: ${res.status}`)

  const data: Array<{ sigla?: string; nome?: string }> = await res.json()

  return data
    .map((item) => ({ value: item.sigla ?? '', label: item.nome ?? item.sigla ?? '' }))
    .filter((opt) => opt.value && opt.label)
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

/**
 * Municípios por UF via IBGE.
 * Endpoint: GET /estados/{uf}/municipios
 */
export async function fetchIbgeCitiesByUf(
  uf: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const normalizedUf = normalizeUf(uf)
  const res = await fetch(`${IBGE_BASE}/estados/${normalizedUf}/municipios`, { signal })
  if (!res.ok) throw new Error(`IBGE municípios falhou: ${res.status}`)

  const data: Array<{ nome?: string }> = await res.json()
  return data.map((item) => item.nome ?? '').filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}


import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type MunicipioRow = {
  codigo_ibge: number
  municipio: string
  uf: string
  estado: string
}

export type MunicipioIbgeMatch = {
  codigoIbge: string
  municipio: string
  uf: string
}

function normalizeLookupText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeUf(value: string): string {
  return value.trim().toUpperCase().slice(0, 2)
}

let lookupByCityUf: Map<string, MunicipioIbgeMatch> | null = null

function loadLookupByCityUf(): Map<string, MunicipioIbgeMatch> {
  if (lookupByCityUf) return lookupByCityUf

  const rootDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..')
  const filePath = path.join(rootDir, 'public/data/municipios.json')
  const raw = readFileSync(filePath, 'utf8')
  const rows = JSON.parse(raw) as MunicipioRow[]

  lookupByCityUf = new Map()
  for (const row of rows) {
    const uf = normalizeUf(row.uf)
    const municipio = String(row.municipio ?? '').trim()
    if (!municipio || !uf) continue

    const match: MunicipioIbgeMatch = {
      codigoIbge: String(row.codigo_ibge).padStart(7, '0').slice(-7),
      municipio,
      uf,
    }
    lookupByCityUf.set(`${normalizeLookupText(municipio)}|${uf}`, match)
  }

  return lookupByCityUf
}

export function lookupMunicipioIbge(
  city: string | null | undefined,
  state: string | null | undefined,
): MunicipioIbgeMatch | null {
  const municipio = city?.trim()
  const uf = state ? normalizeUf(state) : ''
  if (!municipio || !uf) return null

  return loadLookupByCityUf().get(`${normalizeLookupText(municipio)}|${uf}`) ?? null
}

export function enrichEnderecoWithMunicipioIbge(
  endereco: Record<string, string>,
): Record<string, string> {
  const ibgeDigits = endereco.codigo_ibge_municipio?.replace(/\D/g, '') ?? ''
  if (ibgeDigits.length === 7) {
    return {
      ...endereco,
      codigo_ibge_municipio: ibgeDigits,
    }
  }

  const resolved = lookupMunicipioIbge(endereco.cidade, endereco.uf)
  if (!resolved) return endereco

  return {
    ...endereco,
    codigo_ibge_municipio: resolved.codigoIbge,
    cidade: endereco.cidade?.trim() || resolved.municipio,
    uf: endereco.uf?.trim() || resolved.uf,
  }
}

export function resolveMunicipioFromEndereco(endereco: Record<string, unknown>): {
  municipio: string | null
  ibge: string | null
} {
  const cidade =
    typeof endereco.cidade === 'string'
      ? endereco.cidade
      : typeof endereco.municipio === 'string'
        ? endereco.municipio
        : null
  const uf = typeof endereco.uf === 'string' ? endereco.uf : null

  const ibgeRaw =
    typeof endereco.ibge === 'string'
      ? endereco.ibge
      : typeof endereco.codigoIbge === 'string'
        ? endereco.codigoIbge
        : typeof endereco.codigo_ibge === 'string'
          ? endereco.codigo_ibge
          : typeof endereco.codigo_ibge_municipio === 'string'
            ? endereco.codigo_ibge_municipio
            : null

  let ibge = ibgeRaw?.replace(/\D/g, '').slice(0, 7) ?? null
  if (ibge && ibge.length !== 7) ibge = null

  let municipio = cidade?.trim() || null
  if (!ibge && cidade && uf) {
    const resolved = lookupMunicipioIbge(cidade, uf)
    if (resolved) {
      ibge = resolved.codigoIbge
      municipio = municipio ?? resolved.municipio
    }
  }

  return { municipio, ibge: ibge && ibge.length === 7 ? ibge : null }
}

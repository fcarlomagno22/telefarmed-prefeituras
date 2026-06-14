import { isValidCnpj, normalizeCnpj } from '../../lib/cnpj.js'
import { ProfissionalCadastroError } from './errors.js'

type BrasilApiCnpjResponse = {
  cnpj?: string
  razao_social?: string
  nome_fantasia?: string
  descricao_situacao_cadastral?: string
  situacao_cadastral?: number | string
  data_inicio_atividade?: string
  natureza_juridica?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  uf?: string
  message?: string
}

export type ConsultaCnpjEmpresaDto = {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  situacaoCadastral: string
  dataAbertura: string
  naturezaJuridica: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

type CacheEntry = {
  expiresAt: number
  data: ConsultaCnpjEmpresaDto
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CACHE_MAX_ENTRIES = 500
const cache = new Map<string, CacheEntry>()

function formatBrDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim())
  if (!match) return isoDate
  return `${match[3]}/${match[2]}/${match[1]}`
}

function formatSituacaoCadastral(value: string): string {
  const normalized = value.trim()
  if (!normalized) return 'Não informada'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
}

function maskCnpj(digits: string): string {
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 8) return value
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function isEmpresaAtiva(payload: BrasilApiCnpjResponse): boolean {
  const situacao = String(payload.situacao_cadastral ?? '').trim()
  if (situacao === '2') return true

  const descricao = payload.descricao_situacao_cadastral?.trim().toUpperCase() ?? ''
  return descricao.includes('ATIVA')
}

function resolveLookupErrorMessage(status: number, payload?: BrasilApiCnpjResponse): string {
  if (status === 404) {
    return 'CNPJ não encontrado na base da Receita Federal. Verifique o número informado.'
  }
  if (status === 429) {
    return 'Consulta temporariamente indisponível. Aguarde alguns segundos e tente novamente.'
  }
  if (payload?.message) return payload.message
  return 'Não foi possível consultar o CNPJ na Receita Federal. Tente novamente.'
}

function mapBrasilApiToEmpresa(payload: BrasilApiCnpjResponse): ConsultaCnpjEmpresaDto {
  const digits = (payload.cnpj ?? '').replace(/\D/g, '')

  return {
    cnpj: maskCnpj(digits),
    razaoSocial: payload.razao_social?.trim() ?? '',
    nomeFantasia: payload.nome_fantasia?.trim() || payload.razao_social?.trim() || '',
    situacaoCadastral: formatSituacaoCadastral(payload.descricao_situacao_cadastral ?? ''),
    dataAbertura: payload.data_inicio_atividade
      ? formatBrDate(payload.data_inicio_atividade)
      : 'Não informada',
    naturezaJuridica: payload.natureza_juridica?.trim() || 'Não informada',
    cep: payload.cep ? maskCep(payload.cep) : '',
    logradouro: payload.logradouro?.trim() || 'Não informado',
    numero: payload.numero?.trim() || 'S/N',
    complemento: payload.complemento?.trim() ?? '',
    bairro: payload.bairro?.trim() || 'Não informado',
    cidade: payload.municipio?.trim() || 'Não informada',
    uf: payload.uf?.trim().toUpperCase() ?? '',
  }
}

function readCache(cnpj: string): ConsultaCnpjEmpresaDto | null {
  const entry = cache.get(cnpj)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    cache.delete(cnpj)
    return null
  }
  return entry.data
}

function writeCache(cnpj: string, data: ConsultaCnpjEmpresaDto): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) cache.delete(oldestKey)
  }
  cache.set(cnpj, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

export async function consultarCnpjEmpresa(cnpjInput: string): Promise<ConsultaCnpjEmpresaDto> {
  if (!isValidCnpj(cnpjInput)) {
    throw new ProfissionalCadastroError('CNPJ inválido.', 'INVALID_DATA', 400)
  }

  const cnpj = normalizeCnpj(cnpjInput)
  const cached = readCache(cnpj)
  if (cached) return cached

  let response: Response
  try {
    response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Telefarmed/1.0 (+https://telefarmed.com.br)',
      },
      signal: AbortSignal.timeout(12_000),
    })
  } catch {
    throw new ProfissionalCadastroError(
      'Falha de conexão ao consultar a Receita Federal. Tente novamente.',
      'INVALID_DATA',
      502,
    )
  }

  let payload: BrasilApiCnpjResponse | undefined
  try {
    payload = (await response.json()) as BrasilApiCnpjResponse
  } catch {
    payload = undefined
  }

  if (!response.ok) {
    throw new ProfissionalCadastroError(
      resolveLookupErrorMessage(response.status, payload),
      'INVALID_DATA',
      response.status === 404 ? 404 : 502,
    )
  }

  if (!payload?.razao_social?.trim()) {
    throw new ProfissionalCadastroError(
      'CNPJ não encontrado na base da Receita Federal. Verifique o número informado.',
      'INVALID_DATA',
      404,
    )
  }

  if (!isEmpresaAtiva(payload)) {
    throw new ProfissionalCadastroError(
      'CNPJ com situação cadastral irregular. Regularize a empresa antes de continuar.',
      'INVALID_DATA',
      400,
    )
  }

  const empresa = mapBrasilApiToEmpresa(payload)
  writeCache(cnpj, empresa)
  return empresa
}

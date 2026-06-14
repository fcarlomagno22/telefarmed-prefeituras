import { maskCep, maskCnpj } from '../masks'

export type BrasilApiCnpjResponse = {
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
  type?: string
}

export class CnpjReceitaFederalLookupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CnpjReceitaFederalLookupError'
  }
}

function formatBrDate(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim())
  if (!match) return isoDate
  return `${match[3]}/${match[2]}/${match[1]}`
}

function formatSituacaoCadastral(value: string) {
  const normalized = value.trim()
  if (!normalized) return 'Não informada'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
}

function resolveLookupErrorMessage(status: number, payload?: BrasilApiCnpjResponse) {
  if (status === 404) {
    return 'CNPJ não encontrado na base da Receita Federal. Verifique o número informado.'
  }
  if (status === 429) {
    return 'Consulta temporariamente indisponível. Aguarde alguns segundos e tente novamente.'
  }
  if (payload?.message) return payload.message
  return 'Não foi possível consultar o CNPJ na Receita Federal. Tente novamente.'
}

export async function fetchCnpjReceitaFederal(cnpj: string): Promise<BrasilApiCnpjResponse> {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) {
    throw new CnpjReceitaFederalLookupError('CNPJ inválido para consulta.')
  }

  let response: Response
  try {
    response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Telefarmed/1.0 (+https://telefarmed.com.br)',
      },
    })
  } catch {
    throw new CnpjReceitaFederalLookupError(
      'Falha de conexão ao consultar a Receita Federal. Verifique sua internet e tente novamente.',
    )
  }

  let payload: BrasilApiCnpjResponse | undefined
  try {
    payload = (await response.json()) as BrasilApiCnpjResponse
  } catch {
    payload = undefined
  }

  if (!response.ok) {
    throw new CnpjReceitaFederalLookupError(resolveLookupErrorMessage(response.status, payload))
  }

  if (!payload?.razao_social?.trim()) {
    throw new CnpjReceitaFederalLookupError(
      'CNPJ não encontrado na base da Receita Federal. Verifique o número informado.',
    )
  }

  return payload
}

export type CnpjReceitaFederalEmpresaData = {
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

export function mapBrasilApiCnpjToEmpresaData(
  payload: BrasilApiCnpjResponse,
): CnpjReceitaFederalEmpresaData {
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
    uf: payload.uf?.trim() ?? '',
  }
}

export async function fetchEmpresaDataByCnpjReceitaFederal(
  cnpj: string,
): Promise<CnpjReceitaFederalEmpresaData> {
  const payload = await fetchCnpjReceitaFederal(cnpj)
  return mapBrasilApiCnpjToEmpresaData(payload)
}

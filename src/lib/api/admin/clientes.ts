import type {
  AdminClienteContact,
  AdminClienteContrato,
  AdminClienteContratoTipo,
  AdminClientePrecoEspecialidade,
  AdminClientePrecoProfissao,
  AdminClienteRow,
  AdminClienteStatus,
  AdminClientesTab,
} from '../../../types/adminClientes'
import type { AdminClienteUbtsResponse } from '../../../types/adminClienteUbts'
import { ApiError, apiFetch } from '../http'

export class AdminClientesApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'AdminClientesApiError'
  }
}

function mapError(error: unknown): AdminClientesApiError {
  if (error instanceof ApiError) {
    return new AdminClientesApiError(error.message, error.status, error.code)
  }
  return new AdminClientesApiError('Não foi possível completar a requisição.', 0)
}

export type ClientesSummaryResponse = {
  ativas: number
  ativasTrend: string
  implantacao: number
  implantacaoTrend: string
  prospects: number
  prospectsTrend: string
  suspensas: number
  suspensasTrend: string
  totalCadastrados: number
  ultimaAtualizacaoMunicipio: string
  ultimaAtualizacaoAgo: string
  porStatus: {
    ativas: number
    implantacao: number
    prospects: number
    suspensas: number
    semContrato: number
  }
}

export type ClinicoProfessionApi = {
  id: string
  name: string
  councilLabel: string
  councilAcronym: string
  active: boolean
  specialtyIds: string[]
}

export type ClinicoSpecialtyApi = {
  id: string
  name: string
  active: boolean
  professionIds: string[]
}

export type ClinicoCatalogResponse = {
  professions: ClinicoProfessionApi[]
  specialties: ClinicoSpecialtyApi[]
}

export type ClienteContratoTipoApi = {
  id: string
  label: string
  description: string
  modalidade: AdminClienteContratoTipo
}

export type ClienteContratoCatalogResponse = {
  contractTypes: ClienteContratoTipoApi[]
  defaultAllowExceedPackage?: boolean
  defaultAvulsoUnitValueBrl?: string
}

export type ListEntidadesParams = {
  search?: string
  status?: AdminClienteStatus | 'all'
  tab?: AdminClientesTab
}

export type CreateEntidadePayload = {
  pin: string
  nome: string
  subtitulo: string
  razaoSocial: string
  cnpj: string
  municipio: string
  uf: string
  status: AdminClienteStatus
  logoHue?: number
  logoDataUrl?: string
  gestor: AdminClienteRow['gestor']
  contatoContrato?: AdminClienteRow['contatoContrato']
  contatoTi: AdminClienteRow['contatoTi']
  contatoSaude: AdminClienteRow['contatoSaude']
}

export type UpdateEntidadeContactsPayload = {
  pin: string
  gestor: AdminClienteRow['gestor']
  contatoContrato?: AdminClienteRow['contatoContrato']
  contatoTi: AdminClienteRow['contatoTi']
  contatoSaude: AdminClienteRow['contatoSaude']
}

export type UpdateEntidadePayload = {
  pin: string
  nome: string
  subtitulo: string
  razaoSocial: string
  cnpj: string
  municipio: string
  uf: string
  logoHue?: number
  logoDataUrl?: string
}

export type UpdateEntidadeStatusPayload = {
  pin: string
  status: AdminClienteStatus
}

export type CreateContratoPayload = {
  pin: string
  numero?: string
  tipo: string
  dataAssinatura: string
  dataEncerramento?: string | null
  consultasContratadas?: number | null
  permiteUltrapassar: boolean
  aceitaPacientesOutrosMunicipios?: boolean
  precosPorProfissao: AdminClientePrecoProfissao[]
  precosPorEspecialidade: AdminClientePrecoEspecialidade[]
  excedentePrecosPorProfissao?: AdminClientePrecoProfissao[] | null
  excedentePrecosPorEspecialidade?: AdminClientePrecoEspecialidade[] | null
  especialidadesAutorizadas: string[]
  contatoContrato?: AdminClienteContact
}

export type UpdateContratoPayload = Omit<CreateContratoPayload, 'contatoContrato'>

export function isAdminClientesApiError(error: unknown): error is AdminClientesApiError {
  return error instanceof AdminClientesApiError
}

export async function fetchClientesSummary(accessToken: string): Promise<ClientesSummaryResponse> {
  try {
    return await apiFetch<ClientesSummaryResponse>('/admin/clientes/summary', { accessToken })
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchClientesClinicoCatalog(
  accessToken: string,
  activeOnly = true,
): Promise<ClinicoCatalogResponse> {
  try {
    const query = new URLSearchParams({ activeOnly: activeOnly ? 'true' : 'false' })
    return await apiFetch<ClinicoCatalogResponse>(`/admin/clientes/catalog/clinico?${query}`, {
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchClientesContratoCatalog(
  accessToken: string,
): Promise<ClienteContratoCatalogResponse> {
  try {
    return await apiFetch<ClienteContratoCatalogResponse>('/admin/clientes/catalog/contratos', {
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchClientesEntidades(
  accessToken: string,
  params: ListEntidadesParams = {},
): Promise<AdminClienteRow[]> {
  try {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.status) query.set('status', params.status)
    if (params.tab) query.set('tab', params.tab)

    const suffix = query.toString() ? `?${query.toString()}` : ''
    const data = await apiFetch<{ entidades: AdminClienteRow[] }>(
      `/admin/clientes/entidades${suffix}`,
      { accessToken },
    )
    return data.entidades
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchClienteEntidade(
  accessToken: string,
  entidadeId: string,
): Promise<AdminClienteRow> {
  try {
    const data = await apiFetch<{ entidade: AdminClienteRow }>(
      `/admin/clientes/entidades/${entidadeId}`,
      { accessToken },
    )
    return data.entidade
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchClienteUbts(
  accessToken: string,
  entidadeId: string,
): Promise<AdminClienteUbtsResponse> {
  try {
    return await apiFetch<AdminClienteUbtsResponse>(
      `/admin/clientes/entidades/${entidadeId}/ubts`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export type ClienteUbtPayload = {
  name: string
  cnes?: string
  unitType: 'fixa' | 'movel'
  status: 'ativa' | 'manutencao' | 'inativa'
  regionKey: string
  regionLabel: string
  phone?: string
  dailyCapacity?: number
  stationsTotal: number
  address?: {
    street?: string
    number?: string
    neighborhood?: string
    city?: string
    state?: string
    cep?: string
  }
}

export async function createClienteUbt(
  accessToken: string,
  entidadeId: string,
  payload: ClienteUbtPayload,
): Promise<AdminClienteUbtsResponse> {
  try {
    return await apiFetch<AdminClienteUbtsResponse>(
      `/admin/clientes/entidades/${entidadeId}/ubts`,
      { method: 'POST', accessToken, json: payload },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function updateClienteUbt(
  accessToken: string,
  entidadeId: string,
  ubtId: string,
  payload: Partial<ClienteUbtPayload>,
): Promise<AdminClienteUbtsResponse> {
  try {
    return await apiFetch<AdminClienteUbtsResponse>(
      `/admin/clientes/entidades/${entidadeId}/ubts/${ubtId}`,
      { method: 'PATCH', accessToken, json: payload },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function deleteClienteUbt(
  accessToken: string,
  entidadeId: string,
  ubtId: string,
): Promise<AdminClienteUbtsResponse> {
  try {
    return await apiFetch<AdminClienteUbtsResponse>(
      `/admin/clientes/entidades/${entidadeId}/ubts/${ubtId}`,
      { method: 'DELETE', accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function createClienteEntidade(
  accessToken: string,
  payload: CreateEntidadePayload,
): Promise<AdminClienteRow> {
  try {
    const data = await apiFetch<{ entidade: AdminClienteRow }>('/admin/clientes/entidades', {
      method: 'POST',
      accessToken,
      json: payload,
    })
    return data.entidade
  } catch (error) {
    throw mapError(error)
  }
}

export async function updateClienteEntidadeStatus(
  accessToken: string,
  entidadeId: string,
  payload: UpdateEntidadeStatusPayload,
): Promise<AdminClienteRow> {
  try {
    const data = await apiFetch<{ entidade: AdminClienteRow }>(
      `/admin/clientes/entidades/${entidadeId}/status`,
      { method: 'PATCH', accessToken, json: payload },
    )
    return data.entidade
  } catch (error) {
    throw mapError(error)
  }
}

export async function updateClienteEntidadeContacts(
  accessToken: string,
  entidadeId: string,
  payload: UpdateEntidadeContactsPayload,
): Promise<AdminClienteRow> {
  try {
    const data = await apiFetch<{ entidade: AdminClienteRow }>(
      `/admin/clientes/entidades/${entidadeId}/contacts`,
      { method: 'PATCH', accessToken, json: payload },
    )
    return data.entidade
  } catch (error) {
    throw mapError(error)
  }
}

export async function updateClienteEntidade(
  accessToken: string,
  entidadeId: string,
  payload: UpdateEntidadePayload,
): Promise<AdminClienteRow> {
  try {
    const data = await apiFetch<{ entidade: AdminClienteRow }>(
      `/admin/clientes/entidades/${entidadeId}`,
      { method: 'PATCH', accessToken, json: payload },
    )
    return data.entidade
  } catch (error) {
    throw mapError(error)
  }
}

export async function deleteClienteEntidade(
  accessToken: string,
  entidadeId: string,
  pin: string,
): Promise<void> {
  try {
    await apiFetch(`/admin/clientes/entidades/${entidadeId}`, {
      method: 'DELETE',
      accessToken,
      json: { pin },
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function createClienteContrato(
  accessToken: string,
  entidadeId: string,
  payload: CreateContratoPayload,
): Promise<AdminClienteRow> {
  try {
    const data = await apiFetch<{ entidade: AdminClienteRow }>(
      `/admin/clientes/entidades/${entidadeId}/contratos`,
      { method: 'POST', accessToken, json: payload },
    )
    return data.entidade
  } catch (error) {
    throw mapError(error)
  }
}

export async function updateClienteContratoStatus(
  accessToken: string,
  contratoId: string,
  pin: string,
  action: 'suspender' | 'reativar' | 'encerrar',
): Promise<AdminClienteRow> {
  try {
    const data = await apiFetch<{ entidade: AdminClienteRow }>(
      `/admin/clientes/contratos/${contratoId}/status`,
      { method: 'PATCH', accessToken, json: { pin, action } },
    )
    return data.entidade
  } catch (error) {
    throw mapError(error)
  }
}

export async function updateClienteContrato(
  accessToken: string,
  contratoId: string,
  payload: UpdateContratoPayload,
): Promise<AdminClienteRow> {
  try {
    const data = await apiFetch<{ entidade: AdminClienteRow }>(
      `/admin/clientes/contratos/${contratoId}`,
      { method: 'PATCH', accessToken, json: payload },
    )
    return data.entidade
  } catch (error) {
    throw mapError(error)
  }
}

export async function deleteClienteContrato(
  accessToken: string,
  contratoId: string,
  pin: string,
): Promise<AdminClienteRow> {
  try {
    const data = await apiFetch<{ entidade: AdminClienteRow }>(
      `/admin/clientes/contratos/${contratoId}`,
      { method: 'DELETE', accessToken, json: { pin } },
    )
    return data.entidade
  } catch (error) {
    throw mapError(error)
  }
}

export type { AdminClienteContrato, AdminClienteRow }

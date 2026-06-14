import type { AdminOperatorRow } from '../../../data/adminOperadoresMock'
import type { AuditLogEntry } from '../../../types/auditLogs'
import type {
  UbtCredentialsAccessLogsQuery,
  UbtCredentialsListQuery,
} from '../../mockServices/ubt/credenciais'
import { ApiError, apiFetch } from '../http'

export class UbtCredenciaisApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'UbtCredenciaisApiError'
  }
}

function mapError(error: unknown): UbtCredenciaisApiError {
  if (error instanceof ApiError) {
    return new UbtCredenciaisApiError(error.message, error.status, error.code)
  }
  return new UbtCredenciaisApiError('Não foi possível completar a requisição.', 0)
}

type PortalUserDto = {
  id: string
  name: string
  email: string
  cpf?: string
  role: string
  accessLevel: string
  status: 'ativo' | 'inativo'
  initials: string
  avatarClassName: string
  hasPassword: boolean
  hasAuthorizationPin?: boolean
  pagePermissions: AdminOperatorRow['pagePermissions']
  ubtId?: string
  ubtName?: string
  raKey?: string
  raLabel?: string
  isUbtResponsible?: boolean
  scope: 'Prefeitura' | 'UBT'
  unitName: string
  contractingEntity: AdminOperatorRow['contractingEntity']
  lastAccessLabel: string
  profileLabel: string
}

function mapPortalToOperatorRow(user: PortalUserDto): AdminOperatorRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: user.cpf,
    role: user.role,
    accessLevel: user.accessLevel as AdminOperatorRow['accessLevel'],
    status: user.status,
    initials: user.initials,
    avatarClassName: user.avatarClassName,
    hasPassword: user.hasPassword,
    hasAuthorizationPin: Boolean(user.hasAuthorizationPin),
    pagePermissions: user.pagePermissions,
    ubtId: user.ubtId,
    ubtName: user.ubtName,
    raKey: user.raKey,
    raLabel: user.raLabel,
    isUbtResponsible: user.isUbtResponsible,
    scope: user.scope,
    unitName: user.unitName,
    contractingEntity: user.contractingEntity,
    lastAccessLabel: user.lastAccessLabel,
    profileLabel: user.profileLabel,
  }
}

function buildListQuerySuffix(query?: UbtCredentialsListQuery): string {
  if (!query) return ''
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.profile) params.set('profile', query.profile)
  if (query.status) params.set('status', query.status)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export async function apiFetchUbtPortalCredentials(
  accessToken: string,
  query?: UbtCredentialsListQuery,
): Promise<{ users: AdminOperatorRow[]; canManage: boolean }> {
  try {
    const data = await apiFetch<{ users: PortalUserDto[]; canManage: boolean }>(
      `/ubt/credenciais/operadores${buildListQuerySuffix(query)}`,
      { accessToken },
    )
    return {
      users: data.users.map(mapPortalToOperatorRow),
      canManage: data.canManage,
    }
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchUbtPortalCredentialById(
  accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(`/ubt/credenciais/operadores/${id}`, {
      accessToken,
    })
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiCreateUbtPortalCredential(
  accessToken: string,
  body: {
    name: string
    email: string
    cpf: string
    role: string
    accessLevel: string
    status: 'ativo' | 'inativo'
    pagePermissions: AdminOperatorRow['pagePermissions']
    password: string
    isUbtResponsible?: boolean
    authorizationPin?: string
  },
): Promise<AdminOperatorRow> {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>('/ubt/credenciais/operadores', {
      method: 'POST',
      accessToken,
      json: body,
    })
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiUpdateUbtPortalCredential(
  accessToken: string,
  id: string,
  body: Record<string, unknown>,
): Promise<AdminOperatorRow> {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(`/ubt/credenciais/operadores/${id}`, {
      method: 'PATCH',
      accessToken,
      json: body,
    })
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiDeactivateUbtPortalCredential(
  accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(
      `/ubt/credenciais/operadores/${id}/desativar`,
      { method: 'POST', accessToken },
    )
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiActivateUbtPortalCredential(
  accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(
      `/ubt/credenciais/operadores/${id}/reativar`,
      { method: 'POST', accessToken },
    )
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiDeleteUbtPortalCredential(accessToken: string, id: string): Promise<void> {
  try {
    await apiFetch(`/ubt/credenciais/operadores/${id}`, {
      method: 'DELETE',
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchUbtCredenciaisAccessLogs(
  accessToken: string,
  query?: UbtCredentialsAccessLogsQuery,
): Promise<{ entries: AuditLogEntry[]; total: number }> {
  try {
    const params = new URLSearchParams()
    if (query?.limit) params.set('limit', String(query.limit))
    if (query?.offset) params.set('offset', String(query.offset))
    if (query?.search) params.set('search', query.search)
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    if (query?.atorId) params.set('atorId', query.atorId)
    if (query?.acao) params.set('acao', query.acao)

    const suffix = params.toString() ? `?${params.toString()}` : ''
    return await apiFetch<{ entries: AuditLogEntry[]; total: number }>(
      `/ubt/credenciais/logs-acesso${suffix}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export function isUbtCredenciaisApiError(error: unknown): error is UbtCredenciaisApiError {
  return error instanceof UbtCredenciaisApiError
}

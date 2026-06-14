import type { PrefeituraCredentialUser } from '../../../config/prefeituraCredenciaisConfig'
import type { AdminOperatorRow } from '../../../data/adminOperadoresMock'
import type { PrefeituraCredentialUbtOption } from '../../../data/prefeituraAccessCredentialsMock'
import type { AuditLogEntry } from '../../../types/auditLogs'
import type { PrefeituraCredentialsAccessLogsQuery } from '../../mockServices/prefeitura/credenciais'
import { ApiError, apiFetch } from '../http'

export class PrefeituraCredenciaisApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PrefeituraCredenciaisApiError'
  }
}

function mapError(error: unknown): PrefeituraCredenciaisApiError {
  if (error instanceof ApiError) {
    return new PrefeituraCredenciaisApiError(error.message, error.status, error.code)
  }
  return new PrefeituraCredenciaisApiError('Não foi possível completar a requisição.', 0)
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

function mapPortalToGestor(user: PortalUserDto): PrefeituraCredentialUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: user.cpf ?? '',
    role: user.role,
    contractingEntityId: user.contractingEntity.id,
    contractingEntity: user.contractingEntity,
    accessLevel: user.accessLevel as PrefeituraCredentialUser['accessLevel'],
    status: user.status,
    initials: user.initials,
    avatarClassName: user.avatarClassName,
    hasPassword: user.hasPassword,
    hasAuthorizationPin: Boolean(user.hasAuthorizationPin),
    lastAccessLabel: user.lastAccessLabel,
    pagePermissions: user.pagePermissions as PrefeituraCredentialUser['pagePermissions'],
  }
}

export async function apiFetchPrefeituraPortalCredentials(accessToken: string) {
  try {
    const data = await apiFetch<{ users: PortalUserDto[] }>('/prefeitura/credenciais/operadores-ubt', {
      accessToken,
    })
    return data.users.map(mapPortalToOperatorRow)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraGestorCredentials(accessToken: string) {
  try {
    const data = await apiFetch<{ users: PortalUserDto[] }>('/prefeitura/credenciais/gestores', {
      accessToken,
    })
    return data.users.map(mapPortalToGestor)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraUbtOptions(accessToken: string) {
  try {
    const data = await apiFetch<{ options: PrefeituraCredentialUbtOption[] }>(
      '/prefeitura/credenciais/unidades-ubt',
      { accessToken },
    )
    return data.options
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraEntitySummary(accessToken: string) {
  try {
    return await apiFetch<{
      id: string
      razaoSocial: string
      municipality: string
      uf: string
      label: string
    }>('/prefeitura/credenciais/entidade', { accessToken })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiCreatePrefeituraPortalCredential(
  accessToken: string,
  body: {
    name: string
    email: string
    cpf: string
    role: string
    accessLevel: string
    status: 'ativo' | 'inativo'
    ubtId: string
    isUbtResponsible?: boolean
    pagePermissions: AdminOperatorRow['pagePermissions']
    password: string
    authorizationPin?: string
  },
) {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>('/prefeitura/credenciais/operadores-ubt', {
      method: 'POST',
      accessToken,
      json: body,
    })
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiUpdatePrefeituraPortalCredential(
  accessToken: string,
  id: string,
  body: Record<string, unknown>,
) {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(
      `/prefeitura/credenciais/operadores-ubt/${id}`,
      { method: 'PATCH', accessToken, json: body },
    )
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiDeactivatePrefeituraPortalCredential(accessToken: string, id: string) {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(
      `/prefeitura/credenciais/operadores-ubt/${id}/desativar`,
      { method: 'POST', accessToken },
    )
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiActivatePrefeituraPortalCredential(accessToken: string, id: string) {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(
      `/prefeitura/credenciais/operadores-ubt/${id}/reativar`,
      { method: 'POST', accessToken },
    )
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiDeletePrefeituraPortalCredential(accessToken: string, id: string) {
  try {
    await apiFetch(`/prefeitura/credenciais/operadores-ubt/${id}`, {
      method: 'DELETE',
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiTransferPrefeituraPortalCredentialUbt(
  accessToken: string,
  id: string,
  targetUbtId: string,
) {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(
      `/prefeitura/credenciais/operadores-ubt/${id}/transferir-ubt`,
      { method: 'POST', accessToken, json: { targetUbtId } },
    )
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiVerifyPrefeituraPortalResponsiblePin(
  accessToken: string,
  userId: string,
  pin: string,
) {
  try {
    await apiFetch('/prefeitura/credenciais/operadores-ubt/verificar-pin-responsavel', {
      method: 'POST',
      accessToken,
      json: { userId, pin },
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiCreatePrefeituraGestorCredential(
  accessToken: string,
  body: {
    name: string
    email: string
    cpf: string
    role: string
    accessLevel: string
    status: 'ativo' | 'inativo'
    pagePermissions: PrefeituraCredentialUser['pagePermissions']
    password: string
    authorizationPin?: string
  },
) {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>('/prefeitura/credenciais/gestores', {
      method: 'POST',
      accessToken,
      json: body,
    })
    return mapPortalToGestor(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiUpdatePrefeituraGestorCredential(
  accessToken: string,
  id: string,
  body: Record<string, unknown>,
) {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(`/prefeitura/credenciais/gestores/${id}`, {
      method: 'PATCH',
      accessToken,
      json: body,
    })
    return mapPortalToGestor(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiDeactivatePrefeituraGestorCredential(accessToken: string, id: string) {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(
      `/prefeitura/credenciais/gestores/${id}/desativar`,
      { method: 'POST', accessToken },
    )
    return mapPortalToGestor(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiActivatePrefeituraGestorCredential(accessToken: string, id: string) {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(
      `/prefeitura/credenciais/gestores/${id}/reativar`,
      { method: 'POST', accessToken },
    )
    return mapPortalToGestor(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiDeletePrefeituraGestorCredential(accessToken: string, id: string) {
  try {
    await apiFetch(`/prefeitura/credenciais/gestores/${id}`, {
      method: 'DELETE',
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraCredenciaisAccessLogs(
  accessToken: string,
  query?: PrefeituraCredentialsAccessLogsQuery,
) {
  try {
    const params = new URLSearchParams()
    if (query?.limit) params.set('limit', String(query.limit))
    if (query?.offset) params.set('offset', String(query.offset))
    if (query?.search) params.set('search', query.search)
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    if (query?.atorId) params.set('atorId', query.atorId)
    if (query?.portal) params.set('portal', query.portal)
    if (query?.acao) params.set('acao', query.acao)

    const suffix = params.toString() ? `?${params.toString()}` : ''
    return await apiFetch<{ entries: AuditLogEntry[]; total: number }>(
      `/prefeitura/credenciais/logs-acesso${suffix}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export function isPrefeituraCredenciaisApiError(error: unknown): error is PrefeituraCredenciaisApiError {
  return error instanceof PrefeituraCredenciaisApiError
}

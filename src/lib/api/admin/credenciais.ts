import type { AdminInternoCredentialUser } from '../../../config/adminCredenciaisConfig'
import type { PrefeituraCredentialUser } from '../../../config/prefeituraCredenciaisConfig'
import type { AdminOperatorRow } from '../../../data/adminOperadoresMock'
import type { PrefeituraCredentialUbtOption } from '../../../data/prefeituraAccessCredentialsMock'
import { ApiError, apiFetch } from '../http'

export type CredenciaisKpis = {
  internosTotal: number
  prefeituraTotal: number
  ubtTotal: number
  ativosRedeTotal: number
}

export class AdminCredenciaisApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'AdminCredenciaisApiError'
  }
}

function mapError(error: unknown): AdminCredenciaisApiError {
  if (error instanceof ApiError) {
    return new AdminCredenciaisApiError(error.message, error.status, error.code)
  }
  return new AdminCredenciaisApiError('Não foi possível completar a requisição.', 0)
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

function mapPortalToPrefeituraUser(user: PortalUserDto): PrefeituraCredentialUser {
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

export async function fetchCredenciaisKpis(accessToken: string): Promise<CredenciaisKpis> {
  try {
    const data = await apiFetch<{ kpis: CredenciaisKpis }>('/admin/credenciais/kpis', {
      accessToken,
    })
    return data.kpis
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchInternoCredentials(
  accessToken: string,
): Promise<AdminInternoCredentialUser[]> {
  try {
    const data = await apiFetch<{ users: AdminInternoCredentialUser[] }>(
      '/admin/credenciais/internos',
      { accessToken },
    )
    return data.users
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchInternoCredentialDetail(
  accessToken: string,
  id: string,
): Promise<AdminInternoCredentialUser> {
  try {
    const data = await apiFetch<{ user: AdminInternoCredentialUser }>(
      `/admin/credenciais/internos/${id}`,
      { accessToken },
    )
    return data.user
  } catch (error) {
    throw mapError(error)
  }
}

export async function createInternoCredential(
  accessToken: string,
  body: {
    name: string
    email: string
    cpf: string
    role: string
    departmentId: string
    accessLevel: string
    status: 'ativo' | 'inativo'
    pagePermissions: AdminInternoCredentialUser['pagePermissions']
    password: string
    authorizationPin?: string
  },
): Promise<AdminInternoCredentialUser> {
  try {
    const data = await apiFetch<{ user: AdminInternoCredentialUser }>(
      '/admin/credenciais/internos',
      { method: 'POST', accessToken, json: body },
    )
    return data.user
  } catch (error) {
    throw mapError(error)
  }
}

export async function updateInternoCredential(
  accessToken: string,
  id: string,
  body: {
    name?: string
    email?: string
    cpf?: string
    role?: string
    departmentId?: string
    accessLevel?: string
    status?: 'ativo' | 'inativo'
    pagePermissions?: AdminInternoCredentialUser['pagePermissions']
    password?: string
    authorizationPin?: string | null
  },
): Promise<AdminInternoCredentialUser> {
  try {
    const data = await apiFetch<{ user: AdminInternoCredentialUser }>(
      `/admin/credenciais/internos/${id}`,
      { method: 'PATCH', accessToken, json: body },
    )
    return data.user
  } catch (error) {
    throw mapError(error)
  }
}

export async function deactivateInternoCredential(
  accessToken: string,
  id: string,
): Promise<AdminInternoCredentialUser> {
  try {
    const data = await apiFetch<{ user: AdminInternoCredentialUser }>(
      `/admin/credenciais/internos/${id}/desativar`,
      { method: 'POST', accessToken },
    )
    return data.user
  } catch (error) {
    throw mapError(error)
  }
}

export async function activateInternoCredential(
  accessToken: string,
  id: string,
): Promise<AdminInternoCredentialUser> {
  try {
    const data = await apiFetch<{ user: AdminInternoCredentialUser }>(
      `/admin/credenciais/internos/${id}/reativar`,
      { method: 'POST', accessToken },
    )
    return data.user
  } catch (error) {
    throw mapError(error)
  }
}

export async function deleteInternoCredential(accessToken: string, id: string): Promise<void> {
  try {
    await apiFetch(`/admin/credenciais/internos/${id}`, {
      method: 'DELETE',
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export type PortalCredentialsListParams = {
  search?: string
  profile?: string
  status?: 'ativo' | 'inativo'
  ubtId?: string
  contractingEntityId?: string
}

export async function fetchPortalCredentials(
  accessToken: string,
  scope: 'Prefeitura' | 'UBT',
  params: PortalCredentialsListParams = {},
): Promise<AdminOperatorRow[]> {
  try {
    const query = new URLSearchParams({ scope })
    if (params.search) query.set('search', params.search)
    if (params.profile) query.set('profile', params.profile)
    if (params.status) query.set('status', params.status)
    if (params.ubtId) query.set('ubtId', params.ubtId)
    if (params.contractingEntityId) query.set('contractingEntityId', params.contractingEntityId)

    const data = await apiFetch<{ users: PortalUserDto[] }>(
      `/admin/credenciais/portal?${query.toString()}`,
      { accessToken },
    )
    return data.users.map(mapPortalToOperatorRow)
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchPortalCredentialDetail(
  accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(`/admin/credenciais/portal/${id}`, {
      accessToken,
    })
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchPrefeituraCredentialDetail(
  accessToken: string,
  id: string,
): Promise<PrefeituraCredentialUser> {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(`/admin/credenciais/portal/${id}`, {
      accessToken,
    })
    return mapPortalToPrefeituraUser(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchPrefeituraCredentials(
  accessToken: string,
): Promise<PrefeituraCredentialUser[]> {
  const users = await fetchPortalCredentials(accessToken, 'Prefeitura')
  return users.map((row) => mapPortalToPrefeituraUser(row as PortalUserDto))
}

export async function createPortalCredential(
  accessToken: string,
  body: {
    scope: 'Prefeitura' | 'UBT'
    name: string
    email: string
    cpf?: string
    role: string
    accessLevel: string
    status: 'ativo' | 'inativo'
    contractingEntityId: string
    ubtId?: string
    isUbtResponsible?: boolean
    pagePermissions: AdminOperatorRow['pagePermissions']
    password: string
    authorizationPin?: string
  },
): Promise<AdminOperatorRow> {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>('/admin/credenciais/portal', {
      method: 'POST',
      accessToken,
      json: body,
    })
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function updatePortalCredential(
  accessToken: string,
  id: string,
  body: Record<string, unknown>,
): Promise<AdminOperatorRow> {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(`/admin/credenciais/portal/${id}`, {
      method: 'PATCH',
      accessToken,
      json: body,
    })
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function deactivatePortalCredential(
  accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(
      `/admin/credenciais/portal/${id}/desativar`,
      { method: 'POST', accessToken },
    )
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function activatePortalCredential(
  accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(
      `/admin/credenciais/portal/${id}/reativar`,
      { method: 'POST', accessToken },
    )
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function deletePortalCredential(accessToken: string, id: string): Promise<void> {
  try {
    await apiFetch(`/admin/credenciais/portal/${id}`, {
      method: 'DELETE',
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function transferPortalCredentialUbt(
  accessToken: string,
  id: string,
  targetUbtId: string,
): Promise<AdminOperatorRow> {
  try {
    const data = await apiFetch<{ user: PortalUserDto }>(
      `/admin/credenciais/portal/${id}/transferir-ubt`,
      { method: 'POST', accessToken, json: { targetUbtId } },
    )
    return mapPortalToOperatorRow(data.user)
  } catch (error) {
    throw mapError(error)
  }
}

export async function verifyPortalResponsiblePin(
  accessToken: string,
  userId: string,
  pin: string,
): Promise<void> {
  try {
    await apiFetch('/admin/credenciais/portal/verificar-pin', {
      method: 'POST',
      accessToken,
      json: { userId, pin },
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchContractingEntities(accessToken: string) {
  try {
    const data = await apiFetch<{
      entities: Array<{
        id: string
        razaoSocial: string
        municipality: string
        uf: string
        label: string
      }>
    }>('/admin/credenciais/entidades-contratantes', { accessToken })
    return data.entities
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchUbtOptions(accessToken: string): Promise<PrefeituraCredentialUbtOption[]> {
  try {
    const data = await apiFetch<{ options: PrefeituraCredentialUbtOption[] }>(
      '/admin/credenciais/unidades-ubt',
      { accessToken },
    )
    return data.options
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchUbtOptionsByEntity(accessToken: string, entityId: string) {
  try {
    const data = await apiFetch<{ options: PrefeituraCredentialUbtOption[] }>(
      `/admin/credenciais/entidades-contratantes/${entityId}/unidades-ubt`,
      { accessToken },
    )
    return data.options
  } catch (error) {
    throw mapError(error)
  }
}

export function isCredenciaisApiError(error: unknown): error is AdminCredenciaisApiError {
  return error instanceof AdminCredenciaisApiError
}

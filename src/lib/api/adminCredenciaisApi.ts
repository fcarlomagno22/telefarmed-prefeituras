import type { AdminInternoCredentialUser } from '../../config/adminCredenciaisConfig'
import type { AdminOperatorRow } from '../../data/adminOperadoresMock'
import type { PrefeituraCredentialUbtOption } from '../../data/prefeituraAccessCredentialsMock'
import { AdminAuthApiError } from './adminAuthApi'

export type CredenciaisKpis = {
  internosTotal: number
  prefeituraTotal: number
  ubtTotal: number
  ativosRedeTotal: number
}

type ApiErrorBody = {
  error?: string
  code?: string
}

export class AdminCredenciaisApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminCredenciaisApiError'
    this.status = status
    this.code = code
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) return {} as T
  return JSON.parse(text) as T
}

async function request<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)

  const hasJsonBody = init?.body != null && init.body !== ''
  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })

  const body = await parseJson<ApiErrorBody & T>(response)

  if (!response.ok) {
    throw new AdminCredenciaisApiError(
      body.error ?? 'Não foi possível concluir a operação.',
      response.status,
      body.code,
    )
  }

  return body
}

export async function fetchCredenciaisKpis(accessToken: string): Promise<CredenciaisKpis> {
  const { kpis } = await request<{ kpis: CredenciaisKpis }>(
    '/api/v1/admin/credenciais/kpis',
    accessToken,
  )
  return kpis
}

export async function fetchInternoCredentials(accessToken: string): Promise<AdminInternoCredentialUser[]> {
  const { users } = await request<{ users: AdminInternoCredentialUser[] }>(
    '/api/v1/admin/credenciais/internos',
    accessToken,
  )
  return users
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
  const { user } = await request<{ user: AdminInternoCredentialUser }>(
    '/api/v1/admin/credenciais/internos',
    accessToken,
    { method: 'POST', body: JSON.stringify(body) },
  )
  return user
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
  const { user } = await request<{ user: AdminInternoCredentialUser }>(
    `/api/v1/admin/credenciais/internos/${id}`,
    accessToken,
    { method: 'PATCH', body: JSON.stringify(body) },
  )
  return user
}

export async function deactivateInternoCredential(
  accessToken: string,
  id: string,
): Promise<AdminInternoCredentialUser> {
  const { user } = await request<{ user: AdminInternoCredentialUser }>(
    `/api/v1/admin/credenciais/internos/${id}/desativar`,
    accessToken,
    { method: 'POST' },
  )
  return user
}

export async function activateInternoCredential(
  accessToken: string,
  id: string,
): Promise<AdminInternoCredentialUser> {
  const { user } = await request<{ user: AdminInternoCredentialUser }>(
    `/api/v1/admin/credenciais/internos/${id}/reativar`,
    accessToken,
    { method: 'POST' },
  )
  return user
}

export async function deleteInternoCredential(accessToken: string, id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/v1/admin/credenciais/internos/${id}`, accessToken, {
    method: 'DELETE',
  })
}

export async function fetchPortalCredentials(
  accessToken: string,
  scope: 'Prefeitura' | 'UBT',
): Promise<AdminOperatorRow[]> {
  const params = new URLSearchParams({ scope })
  const { users } = await request<{ users: AdminOperatorRow[] }>(
    `/api/v1/admin/credenciais/portal?${params}`,
    accessToken,
  )
  return users
}

export async function createPortalCredential(
  accessToken: string,
  body: {
    scope: 'Prefeitura' | 'UBT'
    name: string
    email: string
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
  const { user } = await request<{ user: AdminOperatorRow }>(
    '/api/v1/admin/credenciais/portal',
    accessToken,
    { method: 'POST', body: JSON.stringify(body) },
  )
  return user
}

export async function updatePortalCredential(
  accessToken: string,
  id: string,
  body: {
    name?: string
    email?: string
    role?: string
    accessLevel?: string
    status?: 'ativo' | 'inativo'
    contractingEntityId?: string
    ubtId?: string
    isUbtResponsible?: boolean
    pagePermissions?: AdminOperatorRow['pagePermissions']
    password?: string
    authorizationPin?: string | null
  },
): Promise<AdminOperatorRow> {
  const { user } = await request<{ user: AdminOperatorRow }>(
    `/api/v1/admin/credenciais/portal/${id}`,
    accessToken,
    { method: 'PATCH', body: JSON.stringify(body) },
  )
  return user
}

export async function deactivatePortalCredential(
  accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  const { user } = await request<{ user: AdminOperatorRow }>(
    `/api/v1/admin/credenciais/portal/${id}/desativar`,
    accessToken,
    { method: 'POST' },
  )
  return user
}

export async function activatePortalCredential(
  accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  const { user } = await request<{ user: AdminOperatorRow }>(
    `/api/v1/admin/credenciais/portal/${id}/reativar`,
    accessToken,
    { method: 'POST' },
  )
  return user
}

export async function deletePortalCredential(accessToken: string, id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/v1/admin/credenciais/portal/${id}`, accessToken, {
    method: 'DELETE',
  })
}

export async function transferPortalCredentialUbt(
  accessToken: string,
  id: string,
  targetUbtId: string,
): Promise<AdminOperatorRow> {
  const { user } = await request<{ user: AdminOperatorRow }>(
    `/api/v1/admin/credenciais/portal/${id}/transferir-ubt`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({ targetUbtId }),
    },
  )
  return user
}

export async function verifyPortalResponsiblePin(
  accessToken: string,
  userId: string,
  pin: string,
): Promise<void> {
  await request<{ ok: true }>('/api/v1/admin/credenciais/portal/verificar-pin', accessToken, {
    method: 'POST',
    body: JSON.stringify({ userId, pin }),
  })
}

export async function fetchContractingEntities(accessToken: string) {
  const { entities } = await request<{
    entities: Array<{
      id: string
      razaoSocial: string
      municipality: string
      uf: string
      label: string
    }>
  }>('/api/v1/admin/credenciais/entidades-contratantes', accessToken)
  return entities
}

export async function fetchUbtOptions(accessToken: string): Promise<PrefeituraCredentialUbtOption[]> {
  const { options } = await request<{ options: PrefeituraCredentialUbtOption[] }>(
    '/api/v1/admin/credenciais/unidades-ubt',
    accessToken,
  )
  return options
}

export async function fetchUbtOptionsByEntity(
  accessToken: string,
  entityId: string,
): Promise<PrefeituraCredentialUbtOption[]> {
  const { options } = await request<{ options: PrefeituraCredentialUbtOption[] }>(
    `/api/v1/admin/credenciais/entidades-contratantes/${entityId}/unidades-ubt`,
    accessToken,
  )
  return options
}

export function isCredenciaisApiError(error: unknown): error is AdminCredenciaisApiError {
  return error instanceof AdminCredenciaisApiError
}

export { AdminAuthApiError }

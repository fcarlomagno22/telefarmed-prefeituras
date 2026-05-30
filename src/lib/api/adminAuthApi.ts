import type { AdminPortalPageId } from '../../config/adminCredenciaisConfig'
import type { PermissionAction } from '../../config/accessCredentials'

export type AdminPagePermissions = Record<AdminPortalPageId, PermissionAction[]>

export type AdminAuthUser = {
  id: string
  cpf: string
  nome: string
  email: string | null
  accessLevel: string
  departmentId: string
  isMaster: boolean
  status: 'ativo' | 'inativo'
  lastLoginAt: string | null
  pagePermissions: AdminPagePermissions
}

type LoginResponse = {
  accessToken: string
  user: AdminAuthUser
}

type RefreshResponse = LoginResponse

type MeResponse = {
  user: AdminAuthUser
}

type ApiErrorBody = {
  error?: string
  code?: string
}

export class AdminAuthApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminAuthApiError'
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
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
    throw new AdminAuthApiError(
      body.error ?? 'Não foi possível concluir a operação.',
      response.status,
      body.code,
    )
  }

  return body
}

export async function adminLogin(credentials: {
  cpf: string
  password: string
}): Promise<LoginResponse> {
  return request<LoginResponse>('/api/v1/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function adminRefreshSession(): Promise<RefreshResponse> {
  return request<RefreshResponse>('/api/v1/admin/auth/refresh', {
    method: 'POST',
  })
}

export async function adminLogout(): Promise<void> {
  await request<{ ok: boolean }>('/api/v1/admin/auth/logout', {
    method: 'POST',
  })
}

export async function adminFetchMe(accessToken: string): Promise<MeResponse> {
  return request<MeResponse>('/api/v1/admin/auth/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function verifyAdminAuthorizationPin(
  accessToken: string,
  pin: string,
): Promise<void> {
  await request<{ ok: true }>('/api/v1/admin/auth/verificar-pin', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pin }),
  })
}

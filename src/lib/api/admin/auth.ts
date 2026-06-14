import type { AdminAuthUser } from '../../mockAuth/adminAuthMock'
import { ApiError, apiFetch } from '../http'

export class AdminAuthApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'AdminAuthApiError'
  }
}

function mapApiError(error: unknown): AdminAuthApiError {
  if (error instanceof ApiError) {
    return new AdminAuthApiError(error.message, error.status, error.code)
  }
  return new AdminAuthApiError('Não foi possível completar a requisição.', 0)
}

export async function apiAdminLogin(credentials: {
  cpf: string
  password: string
}): Promise<{ accessToken: string; user: AdminAuthUser }> {
  try {
    return await apiFetch('/admin/auth/login', {
      method: 'POST',
      json: credentials,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiAdminRefresh(): Promise<{ accessToken: string; user: AdminAuthUser }> {
  try {
    return await apiFetch('/admin/auth/refresh', { method: 'POST' })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiAdminLogout(): Promise<void> {
  try {
    await apiFetch('/admin/auth/logout', { method: 'POST' })
  } catch {
    // logout idempotente no cliente
  }
}

export async function apiAdminMe(accessToken: string): Promise<AdminAuthUser> {
  try {
    const data = await apiFetch<{ user: AdminAuthUser }>('/admin/auth/me', { accessToken })
    return data.user
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiVerifyAdminAuthorizationPin(accessToken: string, pin: string): Promise<void> {
  try {
    await apiFetch('/admin/auth/verificar-pin', {
      method: 'POST',
      accessToken,
      json: { pin },
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

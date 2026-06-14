import type { UbtAuthUser } from '../../mockAuth/ubtAuthMock'
import { ApiError, apiFetch } from '../http'

export class UbtAuthApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'UbtAuthApiError'
  }
}

function mapApiError(error: unknown): UbtAuthApiError {
  if (error instanceof ApiError) {
    return new UbtAuthApiError(error.message, error.status, error.code)
  }
  return new UbtAuthApiError('Não foi possível completar a requisição.', 0)
}

export async function apiUbtLogin(credentials: {
  cpf: string
  password: string
}): Promise<{ accessToken: string; user: UbtAuthUser }> {
  try {
    return await apiFetch('/ubt/auth/login', {
      method: 'POST',
      json: credentials,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiUbtRefresh(): Promise<{ accessToken: string; user: UbtAuthUser }> {
  try {
    return await apiFetch('/ubt/auth/refresh', { method: 'POST' })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiUbtLogout(): Promise<void> {
  try {
    await apiFetch('/ubt/auth/logout', { method: 'POST' })
  } catch {
    // logout idempotente no cliente
  }
}

export async function apiUbtMe(accessToken: string): Promise<UbtAuthUser> {
  try {
    const data = await apiFetch<{ user: UbtAuthUser }>('/ubt/auth/me', { accessToken })
    return data.user
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiVerifyUbtAuthorizationPin(accessToken: string, pin: string): Promise<void> {
  try {
    await apiFetch('/ubt/auth/verificar-pin', {
      method: 'POST',
      accessToken,
      json: { pin },
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiUnlockUbtLgpd(
  accessToken: string,
  pin: string,
): Promise<{ lgpdUnlockToken: string; expiresAt: string }> {
  try {
    return await apiFetch('/ubt/auth/lgpd/desbloquear', {
      method: 'POST',
      accessToken,
      json: { pin },
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiRevokeUbtLgpd(
  accessToken: string,
  lgpdUnlockToken: string,
): Promise<void> {
  try {
    await apiFetch('/ubt/auth/lgpd/revogar', {
      method: 'POST',
      accessToken,
      headers: {
        'X-Ubt-Lgpd-Token': lgpdUnlockToken,
      },
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiCheckUbtLgpdUnlockStatus(
  accessToken: string,
  lgpdUnlockToken: string,
): Promise<boolean> {
  try {
    const data = await apiFetch<{ active: boolean }>('/ubt/auth/lgpd/status', {
      accessToken,
      headers: {
        'X-Ubt-Lgpd-Token': lgpdUnlockToken,
      },
    })
    return data.active
  } catch (error) {
    throw mapApiError(error)
  }
}

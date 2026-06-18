import type { PrefeituraAuthUser } from '../../mockAuth/prefeituraAuthMock'
import type {
  EntidadeBrandingFields,
  EntidadeLogoSignedUrlResponse,
} from '../../types/entidadeBranding'
import { ApiError, apiFetch } from '../http'
import { extractTenantSlugFromHostname } from '../../../config/tenantHost'

export class PrefeituraAuthApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PrefeituraAuthApiError'
  }
}

function mapApiError(error: unknown): PrefeituraAuthApiError {
  if (error instanceof ApiError) {
    return new PrefeituraAuthApiError(error.message, error.status, error.code)
  }
  return new PrefeituraAuthApiError('Não foi possível completar a requisição.', 0)
}

export async function apiPrefeituraLogin(credentials: {
  cpf: string
  password: string
}): Promise<{ accessToken: string; user: PrefeituraAuthUser }> {
  try {
    const headers = new Headers()
    const tenantSlug =
      typeof window !== 'undefined' ? extractTenantSlugFromHostname(window.location.hostname) : null
    if (tenantSlug && typeof window !== 'undefined') {
      headers.set('X-Tenant-Host', window.location.host)
    }

    return await apiFetch('/prefeitura/auth/login', {
      method: 'POST',
      headers,
      json: {
        ...credentials,
        ...(tenantSlug && typeof window !== 'undefined'
          ? { tenantHost: window.location.host }
          : {}),
      },
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiPrefeituraRefresh(): Promise<{ accessToken: string; user: PrefeituraAuthUser }> {
  try {
    return await apiFetch('/prefeitura/auth/refresh', { method: 'POST' })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiPrefeituraLogout(): Promise<void> {
  try {
    await apiFetch('/prefeitura/auth/logout', { method: 'POST' })
  } catch {
    // logout idempotente no cliente
  }
}

export async function apiPrefeituraMe(accessToken: string): Promise<PrefeituraAuthUser> {
  try {
    const data = await apiFetch<{ user: PrefeituraAuthUser }>('/prefeitura/auth/me', { accessToken })
    return data.user
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiVerifyPrefeituraAuthorizationPin(
  accessToken: string,
  pin: string,
): Promise<void> {
  try {
    await apiFetch('/prefeitura/auth/verificar-pin', {
      method: 'POST',
      accessToken,
      json: { pin },
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiPrefeituraEntidadeLogo(
  accessToken: string,
): Promise<EntidadeLogoSignedUrlResponse> {
  try {
    return await apiFetch('/prefeitura/auth/entidade/logo', { accessToken })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiPrefeituraEntidadeBranding(
  accessToken: string,
): Promise<{ branding: EntidadeBrandingFields }> {
  try {
    return await apiFetch('/prefeitura/auth/entidade/branding', { accessToken })
  } catch (error) {
    throw mapApiError(error)
  }
}

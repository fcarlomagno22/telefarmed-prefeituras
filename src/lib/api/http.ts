import { handlePortalAuthFailure } from '../auth/sessionRevocation'
import { tryRefreshAdminAccessToken } from './adminAuthRefresh'
import { tryRefreshPrefeituraAccessToken } from './prefeituraAuthRefresh'
import { tryRefreshProfissionalAccessToken } from './profissionalAuthRefresh'
import { tryRefreshUbtAccessToken } from './ubtAuthRefresh'
import { API_BASE_URL } from './config'

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type ApiFetchOptions = RequestInit & {
  accessToken?: string | null
  json?: unknown
  /** Evita loop infinito após tentativa de refresh. */
  skipAuthRetry?: boolean
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { accessToken, json, skipAuthRetry, ...init } = options
  const headers = new Headers(init.headers)

  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    body: json !== undefined ? JSON.stringify(json) : init.body,
    credentials: 'include',
  })

  const text = await response.text()
  let payload: { error?: string; code?: string } | null = null

  if (text) {
    try {
      payload = JSON.parse(text) as { error?: string; code?: string }
    } catch {
      payload = null
    }
  }

  if (
    !response.ok &&
    response.status === 401 &&
    accessToken &&
    !skipAuthRetry &&
    path.startsWith('/admin/')
  ) {
    const refreshedToken = await tryRefreshAdminAccessToken()
    if (refreshedToken) {
      return apiFetch<T>(path, {
        ...options,
        accessToken: refreshedToken,
        skipAuthRetry: true,
      })
    }
    handlePortalAuthFailure('admin', response.status, payload?.code)
  }

  if (
    !response.ok &&
    response.status === 401 &&
    accessToken &&
    !skipAuthRetry &&
    path.startsWith('/prefeitura/')
  ) {
    const refreshedToken = await tryRefreshPrefeituraAccessToken()
    if (refreshedToken) {
      return apiFetch<T>(path, {
        ...options,
        accessToken: refreshedToken,
        skipAuthRetry: true,
      })
    }
    handlePortalAuthFailure('prefeitura', response.status, payload?.code)
  }

  if (
    !response.ok &&
    response.status === 401 &&
    accessToken &&
    !skipAuthRetry &&
    path.startsWith('/ubt/')
  ) {
    const refreshedToken = await tryRefreshUbtAccessToken()
    if (refreshedToken) {
      return apiFetch<T>(path, {
        ...options,
        accessToken: refreshedToken,
        skipAuthRetry: true,
      })
    }
    handlePortalAuthFailure('ubt', response.status, payload?.code)
  }

  if (
    !response.ok &&
    response.status === 401 &&
    accessToken &&
    !skipAuthRetry &&
    path.startsWith('/profissional/')
  ) {
    const refreshedToken = await tryRefreshProfissionalAccessToken()
    if (refreshedToken) {
      return apiFetch<T>(path, {
        ...options,
        accessToken: refreshedToken,
        skipAuthRetry: true,
      })
    }
    handlePortalAuthFailure('profissional', response.status, payload?.code)
  }

  if (!response.ok) {
    const message = payload?.error ?? 'Não foi possível completar a requisição.'
    throw new ApiError(message, response.status, payload?.code)
  }

  if (!text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}

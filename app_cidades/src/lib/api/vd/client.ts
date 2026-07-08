import { API_BASE_URL } from '../../../config/api'
import { getVdAccessToken } from '../../vd/vdAccessToken'
import type { VdTenantScope } from '../../../types/vdApi'
import { tryRefreshVdAccessToken } from './vdAuthRefresh'
import {
  buildTenantHeaders,
  getVdTenantScope,
  mergeTenantIntoQuery,
} from './tenantScope'

export class VdApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'VdApiError'
    this.status = status
    this.code = code
  }
}

type VdRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  query?: Record<string, string | undefined>
  body?: unknown
  accessToken?: string
  tenantScope?: VdTenantScope
  credentials?: RequestCredentials
  redirect?: RequestRedirect
  /** Evita loop infinito após tentativa de refresh. */
  skipAuthRetry?: boolean
}

async function readResponseBody(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return ''
  }
}

function isHtmlResponse(body: string, contentType: string): boolean {
  const trimmed = body.trimStart().toLowerCase()
  if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) return true
  return contentType.includes('text/html')
}

async function parseJsonBody<T>(response: Response, body: string): Promise<T> {
  const contentType = response.headers.get('content-type') ?? ''

  if (!body.trim()) {
    return undefined as T
  }

  if (isHtmlResponse(body, contentType)) {
    throw new VdApiError(
      'Não foi possível contatar a API. Verifique se o backend está em execução.',
      response.status || 502,
      'NON_JSON_RESPONSE',
    )
  }

  try {
    return JSON.parse(body) as T
  } catch {
    throw new VdApiError(
      'Resposta inválida do servidor.',
      response.status || 502,
      'INVALID_JSON',
    )
  }
}

async function parseErrorResponse(response: Response, body: string): Promise<{ message: string; code?: string }> {
  try {
    const data = await parseJsonBody<{ message?: string; error?: string; code?: string }>(
      response,
      body,
    )
    return {
      message: data.message?.trim() || data.error?.trim() || 'Não foi possível concluir a operação.',
      code: data.code,
    }
  } catch (error) {
    if (error instanceof VdApiError) {
      return { message: error.message, code: error.code }
    }
    return { message: 'Não foi possível concluir a operação.' }
  }
}

function buildUrl(path: string, query: Record<string, string | undefined>, scope: VdTenantScope): string {
  const params = mergeTenantIntoQuery(new URLSearchParams(), scope)

  for (const [key, value] of Object.entries(query)) {
    if (value?.trim()) params.set(key, value.trim())
  }

  const suffix = params.toString()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}${suffix ? `?${suffix}` : ''}`
}

export async function vdRequest<T>(options: VdRequestOptions): Promise<T> {
  const scope = options.tenantScope ?? getVdTenantScope()
  const url = buildUrl(options.path, options.query ?? {}, scope)

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...buildTenantHeaders(scope),
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const accessToken = options.accessToken ?? getVdAccessToken()
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(url, {
    method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: options.credentials ?? 'include',
    redirect: options.redirect ?? 'follow',
  })

  if (response.status === 301 || response.status === 302) {
    const location = response.headers.get('Location')
    if (location && typeof window !== 'undefined') {
      window.location.replace(location)
    }
    throw new VdApiError('Redirecionamento de tenant.', response.status, 'TENANT_REDIRECT')
  }

  if (!response.ok) {
    const body = await readResponseBody(response)
    const parsed = await parseErrorResponse(response, body)

    const hadAccessToken = Boolean(options.accessToken ?? getVdAccessToken())
    const isAuthPath = options.path.startsWith('/vd/auth/')

    if (
      response.status === 401 &&
      hadAccessToken &&
      !options.skipAuthRetry &&
      !isAuthPath
    ) {
      const refreshedToken = await tryRefreshVdAccessToken()
      if (refreshedToken) {
        return vdRequest<T>({
          ...options,
          accessToken: refreshedToken,
          skipAuthRetry: true,
        })
      }
    }

    throw new VdApiError(parsed.message, response.status, parsed.code)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const body = await readResponseBody(response)
  return parseJsonBody<T>(response, body)
}

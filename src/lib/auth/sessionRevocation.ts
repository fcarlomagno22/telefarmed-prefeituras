import { portalPath } from '../../config/portalHost'

export type AuthPortalScope = 'admin' | 'prefeitura' | 'ubt' | 'profissional'

const UNAUTHORIZED_CODES = new Set([
  'INVALID_REFRESH',
  'USER_INACTIVE',
  'NOT_FOUND',
  'SESSION_REVOKED',
])

function sessionRevokedKey(scope: AuthPortalScope): string {
  return `telefarmed.${scope}.sessionRevoked`
}

/** Marca que o usuário saiu explicitamente — bloqueia refresh silencioso via cookie. */
export function markAuthSessionRevoked(scope: AuthPortalScope): void {
  try {
    sessionStorage.setItem(sessionRevokedKey(scope), '1')
  } catch {
    // sessionStorage indisponível
  }
}

export function clearAuthSessionRevoked(scope: AuthPortalScope): void {
  try {
    sessionStorage.removeItem(sessionRevokedKey(scope))
  } catch {
    // sessionStorage indisponível
  }
}

export function isAuthSessionRevoked(scope: AuthPortalScope): boolean {
  try {
    return sessionStorage.getItem(sessionRevokedKey(scope)) === '1'
  } catch {
    return false
  }
}

export function getPortalLoginPath(scope: AuthPortalScope): string {
  return portalPath(scope, '/login')
}

export function isUnauthorizedAuthResponse(status: number, code?: string): boolean {
  if (status === 401) return true
  if (status === 403 && (code === 'USER_INACTIVE' || code === 'TENANT_HOST_MISMATCH')) return true
  if (code && UNAUTHORIZED_CODES.has(code)) return true
  return false
}

type UnauthorizedHandler = () => void

const unauthorizedHandlers = new Map<AuthPortalScope, UnauthorizedHandler>()

export function registerUnauthorizedHandler(
  scope: AuthPortalScope,
  handler: UnauthorizedHandler,
): () => void {
  unauthorizedHandlers.set(scope, handler)
  return () => {
    if (unauthorizedHandlers.get(scope) === handler) {
      unauthorizedHandlers.delete(scope)
    }
  }
}

/** Dispara logout global do portal e redireciona para login. */
export function notifyUnauthorizedSession(scope: AuthPortalScope): void {
  markAuthSessionRevoked(scope)
  const handler = unauthorizedHandlers.get(scope)
  if (handler) {
    handler()
    return
  }

  const loginPath = getPortalLoginPath(scope)
  if (typeof window !== 'undefined' && window.location.pathname !== loginPath) {
    window.location.replace(loginPath)
  }
}

export function handlePortalAuthFailure(scope: AuthPortalScope, status: number, code?: string): void {
  if (!isUnauthorizedAuthResponse(status, code)) return
  notifyUnauthorizedSession(scope)
}

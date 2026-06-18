import { extractTenantSlugFromHostname } from '../../config/tenantHost'
import type { AuthPortalScope } from './sessionRevocation'

const TENANT_SCOPES = new Set<AuthPortalScope>(['prefeitura', 'ubt'])

function hostSlugKey(scope: AuthPortalScope): string {
  return `telefarmed.${scope}.hostSlug`
}

/** Slug do subdomínio atual (null em localhost multi-portal). */
export function currentAuthHostSlug(): string | null {
  if (typeof window === 'undefined') return null
  return extractTenantSlugFromHostname(window.location.hostname)
}

export function bindAuthSessionToHostSlug(scope: AuthPortalScope, slug: string | null): void {
  if (!TENANT_SCOPES.has(scope)) return

  try {
    if (slug) {
      sessionStorage.setItem(hostSlugKey(scope), slug)
    } else {
      sessionStorage.removeItem(hostSlugKey(scope))
    }
  } catch {
    // sessionStorage indisponível
  }
}

export function getAuthSessionHostSlug(scope: AuthPortalScope): string | null {
  if (!TENANT_SCOPES.has(scope)) return null

  try {
    return sessionStorage.getItem(hostSlugKey(scope))
  } catch {
    return null
  }
}

export function clearAuthSessionHostSlug(scope: AuthPortalScope): void {
  if (!TENANT_SCOPES.has(scope)) return

  try {
    sessionStorage.removeItem(hostSlugKey(scope))
  } catch {
    // sessionStorage indisponível
  }
}

/** Sessão de tenant pertence a outro subdomínio — exige logout. */
export function isAuthSessionHostSlugMismatch(scope: AuthPortalScope): boolean {
  const bound = getAuthSessionHostSlug(scope)
  if (!bound) return false

  const current = currentAuthHostSlug()
  if (!current) return false

  return bound !== current
}

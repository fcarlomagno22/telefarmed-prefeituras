import type { VdTenantScope } from '../../../types/vdApi'

const LEGACY_INTERNAL_DEMO_SLUG = '__vd_internal__'

function resolveScopeSlug(slug?: string): string | undefined {
  const value = slug?.trim()
  if (!value || value === LEGACY_INTERNAL_DEMO_SLUG) return undefined
  return value
}

export function mergeTenantIntoQuery(
  params: URLSearchParams,
  scope: VdTenantScope,
): URLSearchParams {
  const slug = resolveScopeSlug(scope.slug)
  if (slug) params.set('slug', slug)
  if (scope.host) params.set('host', scope.host)
  return params
}

export function mergeTenantIntoBody<T extends Record<string, unknown>>(
  body: T,
  scope: VdTenantScope,
): T & { slug?: string; host?: string; tenantHost?: string } {
  const next = { ...body } as T & { slug?: string; host?: string; tenantHost?: string }
  const slug = resolveScopeSlug(scope.slug)
  if (slug) next.slug = slug
  if (scope.host) {
    next.host = scope.host
    next.tenantHost = scope.host
  }
  return next
}

export function buildTenantHeaders(scope: VdTenantScope): Record<string, string> {
  const headers: Record<string, string> = {}
  if (scope.host) {
    headers['X-Forwarded-Host'] = scope.host
  }
  return headers
}

import { env } from './env'

const PUBLIC_ROOT_DOMAIN = env('EXPO_PUBLIC_PUBLIC_ROOT_DOMAIN', 'telefarmed.com.br')

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().split(':')[0] ?? hostname
}

function extractFirstSubdomain(hostname: string): string | null {
  const host = normalizeHostname(hostname)
  const rootDomain = PUBLIC_ROOT_DOMAIN.toLowerCase()

  if (host.endsWith('.localhost')) {
    const slug = host.slice(0, -'.localhost'.length)
    if (!slug || slug.includes('.')) return null
    return slug
  }

  const suffix = `.${rootDomain}`
  if (host.endsWith(suffix)) {
    const slug = host.slice(0, -suffix.length)
    if (!slug || slug.includes('.')) return null
    return slug
  }

  return null
}

/** Slug da entidade em vd-{slug}.telefarmed.com.br (null no host vd interno). */
export function extractVdEntitySlugFromHostname(hostname: string): string | null {
  const subdomain = extractFirstSubdomain(hostname)
  if (!subdomain || subdomain === 'vd') return null
  if (!subdomain.startsWith('vd-')) return null

  const clientSlug = subdomain.slice(3)
  return clientSlug.length > 0 ? clientSlug : null
}

function normalizeEntitySlugInput(value: string): string | null {
  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized === 'vd') return null
  if (normalized.startsWith('vd-')) {
    const entitySlug = normalized.slice(3)
    return entitySlug.length > 0 ? entitySlug : null
  }
  return normalized
}

export function isAppCidadesDedicatedHost(hostname: string): boolean {
  const subdomain = extractFirstSubdomain(hostname)
  if (!subdomain) return false
  return subdomain === 'vd' || subdomain.startsWith('vd-')
}

export function shouldFetchVdTenant(input: {
  slug: string | null
  hostHeader?: string
}): boolean {
  if (input.slug) return true
  if (input.hostHeader && isAppCidadesDedicatedHost(input.hostHeader)) return true
  return false
}

/** Slug usado no GET /vd/tenant — hostname web ou EXPO_PUBLIC_ENTIDADE_SLUG em dev/native. */
export function resolveVdTenantSlug(): string | null {
  const fromEnv = env('EXPO_PUBLIC_ENTIDADE_SLUG', '')
  const normalizedEnv = normalizeEntitySlugInput(fromEnv)
  if (normalizedEnv) return normalizedEnv

  if (typeof window !== 'undefined') {
    return extractVdEntitySlugFromHostname(window.location.hostname)
  }

  return null
}

export function resolveVdTenantHostHeader(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return window.location.hostname
}

import { env } from '../../config/env.js'

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().split(':')[0] ?? hostname
}

function extractFirstSubdomain(hostname: string): string | null {
  const host = normalizeHostname(hostname)
  const rootDomain = env.PUBLIC_ROOT_DOMAIN.toLowerCase()

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

export function isAppCidadesDedicatedHost(hostname: string): boolean {
  const subdomain = extractFirstSubdomain(hostname)
  if (!subdomain) return false
  return subdomain === 'vd' || subdomain.startsWith('vd-')
}

export function isAppCidadesHostReservedSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase()
  return normalized === 'vd' || normalized.startsWith('vd-')
}

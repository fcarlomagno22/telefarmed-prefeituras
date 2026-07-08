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

/** Slug da entidade em vd-{slug}.telefarmed.com.br (null no host vd interno). */
export function extractAppCidadesClientSlug(hostname: string): string | null {
  const subdomain = extractFirstSubdomain(hostname)
  if (!subdomain || subdomain === 'vd') return null
  if (!subdomain.startsWith('vd-')) return null
  const clientSlug = subdomain.slice(3)
  return clientSlug.length > 0 ? clientSlug : null
}

import { VD_LEGACY_INTERNAL_DEMO_SLUG } from './vdPlatformEntity.js'

/** Host do app cidadão Telefarmed (vd / vd.localhost, sem slug de cliente). */
export function isVdPlatformHost(hostname: string): boolean {
  return isAppCidadesDedicatedHost(hostname) && extractAppCidadesClientSlug(hostname) === null
}

/** @deprecated Use isVdPlatformHost */
export const isVdInternalDemoHost = isVdPlatformHost

/** Aceita slug da entidade ou host vd-{slug} (query/dev). */
export function normalizeVdTenantEntitySlugInput(value: string): string | null {
  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized === 'vd' || normalized === VD_LEGACY_INTERNAL_DEMO_SLUG) return null
  if (normalized.startsWith('vd-')) {
    const entitySlug = normalized.slice(3)
    return entitySlug.length > 0 ? entitySlug : null
  }
  return normalized
}

export function isAppCidadesHostReservedSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase()
  return normalized === 'vd' || normalized.startsWith('vd-')
}

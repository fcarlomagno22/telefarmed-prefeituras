import { env } from '../../config/env.js'

/** Hosts fixos da plataforma → kind: platform (não consultam slug de cliente). */
export const PLATFORM_TENANT_HOST_SLUGS = new Set(['admin', 'profissional'])

/** Subdomínios legados / infra — não são slug de tenant no host dedicado. */
export const NON_TENANT_HOST_SLUGS = new Set([
  ...PLATFORM_TENANT_HOST_SLUGS,
  'prefeitura',
  'ubt',
  'seguranca',
  'www',
])

export function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().split(':')[0] ?? hostname
}

/** Primeiro rótulo do host (ex.: santacasa em santacasa.telefarmed.com.br). */
export function extractSubdomainFromHostname(hostname: string): string | null {
  const host = normalizeHostname(hostname)
  const rootDomain = env.PUBLIC_ROOT_DOMAIN.toLowerCase()

  if (host === 'localhost' || host === '127.0.0.1') return null

  const suffixes = ['.localhost', '.telefarmed.local', `.${rootDomain}`] as const

  for (const suffix of suffixes) {
    if (!host.endsWith(suffix)) continue
    const subdomain = host.slice(0, -suffix.length)
    if (!subdomain || subdomain.includes('.')) return null
    return subdomain
  }

  return null
}

/** Slug de tenant (exclui hosts fixos da plataforma e legados). */
export function extractTenantSlugFromHostname(hostname: string): string | null {
  const subdomain = extractSubdomainFromHostname(hostname)
  if (!subdomain || NON_TENANT_HOST_SLUGS.has(subdomain)) return null
  return subdomain
}

export function isPlatformTenantHost(subdomain: string): boolean {
  return PLATFORM_TENANT_HOST_SLUGS.has(subdomain)
}

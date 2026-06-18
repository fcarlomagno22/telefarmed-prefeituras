const PLATFORM_SUBDOMAINS = new Set([
  'admin',
  'prefeitura',
  'profissional',
  'ubt',
  'seguranca',
  'www',
])

const ROOT_DOMAIN = (import.meta.env.VITE_PUBLIC_ROOT_DOMAIN as string | undefined)?.trim() || 'telefarmed.com.br'

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().split(':')[0] ?? hostname
}

/** Slug do tenant a partir do host (null = modo dev multi-portal em localhost). */
export function extractTenantSlugFromHostname(hostname: string): string | null {
  const host = normalizeHostname(hostname)

  if (host === 'localhost' || host === '127.0.0.1') return null

  if (host.endsWith('.localhost')) {
    const slug = host.slice(0, -'.localhost'.length)
    if (!slug || slug.includes('.')) return null
    if (PLATFORM_SUBDOMAINS.has(slug)) return null
    return slug
  }

  if (host.endsWith('.telefarmed.local')) {
    const slug = host.slice(0, -'.telefarmed.local'.length)
    if (!slug || slug.includes('.')) return null
    if (PLATFORM_SUBDOMAINS.has(slug)) return null
    return slug
  }

  const prodSuffix = `.${ROOT_DOMAIN}`
  if (host.endsWith(prodSuffix)) {
    const slug = host.slice(0, -prodSuffix.length)
    if (!slug || slug.includes('.')) return null
    if (PLATFORM_SUBDOMAINS.has(slug)) return null
    return slug
  }

  return null
}

export function getPublicRootDomain(): string {
  return ROOT_DOMAIN
}

function normalizePublicPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

function resolveDevServerPort(): string {
  if (typeof window !== 'undefined' && window.location.port) {
    return window.location.port
  }
  return '5173'
}

function buildDevTenantUrl(slug: string, path: string): string {
  return `http://${slug}.localhost:${resolveDevServerPort()}${normalizePublicPath(path)}`
}

/** Host público do tenant (sem protocolo/path) — útil em mensagens de erro. */
export function formatTenantPublicHost(slug: string): string {
  if (import.meta.env.DEV) {
    return `${slug}.localhost:${resolveDevServerPort()}`
  }
  return `${slug}.${ROOT_DOMAIN}`
}

export function gestaoPublicUrl(entidadeSlug: string, path = '/login'): string {
  return buildGestaoUrl(entidadeSlug, path)
}

export function ubtPublicUrl(ubtSlug: string, path = '/login'): string {
  return buildUbtUrl(ubtSlug, path)
}

export function buildGestaoUrl(entidadeSlug: string, path = '/login'): string {
  const normalizedPath = normalizePublicPath(path)
  if (import.meta.env.DEV) {
    return buildDevTenantUrl(entidadeSlug, normalizedPath)
  }
  return `https://${entidadeSlug}.${ROOT_DOMAIN}${normalizedPath}`
}

export function buildUbtUrl(ubtSlug: string, path = '/login'): string {
  const normalizedPath = normalizePublicPath(path)
  if (import.meta.env.DEV) {
    return buildDevTenantUrl(ubtSlug, normalizedPath)
  }
  return `https://${ubtSlug}.${ROOT_DOMAIN}${normalizedPath}`
}

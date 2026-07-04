const ROOT_DOMAIN =
  (import.meta.env.VITE_PUBLIC_ROOT_DOMAIN as string | undefined)?.trim() || 'telefarmed.com.br'

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().split(':')[0] ?? hostname
}

function extractFirstSubdomain(hostname: string): string | null {
  const host = normalizeHostname(hostname)

  if (host.endsWith('.localhost')) {
    const slug = host.slice(0, -'.localhost'.length)
    if (!slug || slug.includes('.')) return null
    return slug
  }

  const prodSuffix = `.${ROOT_DOMAIN}`
  if (host.endsWith(prodSuffix)) {
    const slug = host.slice(0, -prodSuffix.length)
    if (!slug || slug.includes('.')) return null
    return slug
  }

  return null
}

/** App cidadão (Expo web): vd interno ou vd-{slug} por cliente — nunca portal gestão/UBT. */
export function isAppCidadesDedicatedHost(hostname: string): boolean {
  const subdomain = extractFirstSubdomain(hostname)
  if (!subdomain) return false
  return subdomain === 'vd' || subdomain.startsWith('vd-')
}

/** Slug da instituição em vd-{slug}.telefarmed.com.br (null no vd interno). */
export function extractAppCidadesClientSlug(hostname: string): string | null {
  const subdomain = extractFirstSubdomain(hostname)
  if (!subdomain || subdomain === 'vd') return null
  if (!subdomain.startsWith('vd-')) return null
  const clientSlug = subdomain.slice(3)
  return clientSlug.length > 0 ? clientSlug : null
}

export function isAppCidadesHostReservedSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase()
  return normalized === 'vd' || normalized.startsWith('vd-')
}

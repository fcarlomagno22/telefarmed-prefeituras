export type PortalId = 'ubt' | 'prefeitura' | 'admin' | 'profissional'

const PORTAL_HOSTS: Record<string, PortalId> = {
  'admin.telefarmed.com.br': 'admin',
  'prefeitura.telefarmed.com.br': 'prefeitura',
  'profissional.telefarmed.com.br': 'profissional',
  'ubt.telefarmed.com.br': 'ubt',
}

export const PORTAL_DOCUMENT_TITLES: Record<PortalId, string> = {
  prefeitura: 'Telefarmed | Gestão Administrativa',
  ubt: 'Telefarmed | Atendimento',
  profissional: 'Telefarmed | Painel Profissional',
  admin: 'Telefarmed | Painel Admin',
}

export function getPortalDocumentTitle(portal: PortalId): string {
  return PORTAL_DOCUMENT_TITLES[portal]
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().split(':')[0] ?? hostname
}

/** Portal servido por subdomínio dedicado (produção). Em localhost retorna null. */
export function getPortalFromHost(hostname: string): PortalId | null {
  return PORTAL_HOSTS[normalizeHostname(hostname)] ?? null
}

export function getDedicatedPortal(): PortalId | null {
  if (typeof window === 'undefined') return null
  return getPortalFromHost(window.location.hostname)
}

/** Prefixo de URL do portal: vazio no subdomínio dedicado; `/{portal}` no dev/local. */
export function portalBasePath(portal: PortalId): string {
  if (getDedicatedPortal() === portal) return ''
  return `/${portal}`
}

/** Monta path absoluto do portal (`/login` ou `/admin/login`). */
export function portalPath(portal: PortalId, subpath: string): string {
  const normalized = subpath.startsWith('/') ? subpath : `/${subpath}`
  const base = portalBasePath(portal)
  return base ? `${base}${normalized}` : normalized
}

/** Segmento relativo ao mount do portal (ex.: `dashboard` para `/admin/dashboard` ou `/dashboard`). */
export function portalRouteSegment(portal: PortalId, absolutePath: string): string {
  const base = portalBasePath(portal)
  if (base && absolutePath.startsWith(`${base}/`)) {
    return absolutePath.slice(base.length + 1)
  }
  return absolutePath.replace(/^\//, '')
}

/** Redireciona URLs legadas com prefixo `/admin/...` → `/...` no subdomínio dedicado. */
export function legacyPrefixedPath(portal: PortalId, pathname: string): string | null {
  if (getDedicatedPortal() !== portal) return null
  const legacyPrefix = `/${portal}`
  if (!pathname.startsWith(`${legacyPrefix}/`) && pathname !== legacyPrefix) return null
  const next = pathname.slice(legacyPrefix.length)
  return next || '/login'
}

import { brand } from './brand'
import { extractTenantSlugFromHostname } from './tenantHost'
import type { PublicTenantPortalKind, TenantHostKind } from '../types/tenantHost'

export type PortalId = 'ubt' | 'prefeitura' | 'admin' | 'profissional'

/** Subdomínio público só para links de acompanhamento ao vivo (sem login). */
export const LIVE_SHARE_HOST = 'seguranca.telefarmed.com.br'

/** Hosts de plataforma com portal dedicado (admin, profissional e legado prefeitura/ubt). */
const PLATFORM_HOST_PORTALS: Record<string, PortalId> = {
  'admin.telefarmed.com.br': 'admin',
  'prefeitura.telefarmed.com.br': 'prefeitura',
  'profissional.telefarmed.com.br': 'profissional',
  'ubt.telefarmed.com.br': 'ubt',
}

const PORTAL_TITLE_SUFFIX: Record<PortalId, string> = {
  prefeitura: 'Gestão Administrativa',
  ubt: 'Atendimento',
  profissional: 'Painel Profissional',
  admin: 'Painel Admin',
}

/** Títulos padrão com marca da plataforma (env). */
export const PORTAL_DOCUMENT_TITLES: Record<PortalId, string> = {
  prefeitura: `${brand.appName} | ${PORTAL_TITLE_SUFFIX.prefeitura}`,
  ubt: `${brand.appName} | ${PORTAL_TITLE_SUFFIX.ubt}`,
  profissional: `${brand.appName} | ${PORTAL_TITLE_SUFFIX.profissional}`,
  admin: `${brand.appName} | ${PORTAL_TITLE_SUFFIX.admin}`,
}

export type PortalHostContextInput = {
  hostname: string
  tenantSlug?: string | null
  tenantKind?: TenantHostKind | null
  portalKind?: PublicTenantPortalKind | null
}

export type PortalHostMode = 'platform' | 'tenant' | 'local'

export type PortalHostResolution = {
  dedicatedPortal: PortalId | null
  tenantSlug: string | null
  mode: PortalHostMode
}

let activePortalHostContext: PortalHostContextInput | null = null

/** Atualiza o contexto de host usado por `resolveFromTenantContext` (sincronizado pelo TenantHostProvider). */
export function syncPortalHostContext(input: PortalHostContextInput | null): void {
  activePortalHostContext = input
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().split(':')[0] ?? hostname
}

function mapTenantToDedicatedPortal(
  tenantKind: TenantHostKind,
  portalKind?: PublicTenantPortalKind | null,
): PortalId | null {
  if (tenantKind === 'gestao') return 'prefeitura'
  if (tenantKind === 'ubt') return 'ubt'
  if (tenantKind === 'platform') {
    if (portalKind === 'admin') return 'admin'
    if (portalKind === 'profissional') return 'profissional'
    if (portalKind === 'prefeitura') return 'prefeitura'
    if (portalKind === 'ubt') return 'ubt'
  }
  return null
}

function resolvePlatformPortalFromHostname(hostname: string): PortalId | null {
  return PLATFORM_HOST_PORTALS[normalizeHostname(hostname)] ?? null
}

/** Sincroniza contexto para hosts de plataforma sem slug de tenant (ex.: admin.telefarmed.com.br). */
export function syncPortalHostContextFromWindow(): void {
  if (typeof window === 'undefined') {
    syncPortalHostContext(null)
    return
  }

  const hostname = window.location.hostname
  const platformPortal = resolvePlatformPortalFromHostname(hostname)
  if (platformPortal) {
    syncPortalHostContext({
      hostname,
      tenantSlug: null,
      tenantKind: 'platform',
      portalKind: platformPortal,
    })
    return
  }

  syncPortalHostContext({
    hostname,
    tenantSlug: extractTenantSlugFromHostname(hostname),
    tenantKind: null,
    portalKind: null,
  })
}

/**
 * Resolve portal dedicado a partir do host + contexto do tenant (API pública).
 * Em host de entidade (gestão): `dedicatedPortal === 'prefeitura'` e rotas sem `/prefeitura`.
 */
export function resolveFromTenantContext(
  override?: PortalHostContextInput,
): PortalHostResolution {
  const hostname =
    override?.hostname ??
    activePortalHostContext?.hostname ??
    (typeof window !== 'undefined' ? window.location.hostname : '')
  const normalized = normalizeHostname(hostname)

  if (isLiveShareDedicatedHost(normalized)) {
    return { dedicatedPortal: null, tenantSlug: null, mode: 'local' }
  }

  const input = override ?? activePortalHostContext

  if (input?.tenantSlug && input.tenantKind) {
    return {
      dedicatedPortal: mapTenantToDedicatedPortal(input.tenantKind, input.portalKind),
      tenantSlug: input.tenantSlug,
      mode: input.tenantKind === 'platform' ? 'platform' : 'tenant',
    }
  }

  const platformPortal = resolvePlatformPortalFromHostname(normalized)
  if (platformPortal) {
    return { dedicatedPortal: platformPortal, tenantSlug: null, mode: 'platform' }
  }

  const tenantSlug = extractTenantSlugFromHostname(normalized)
  if (tenantSlug) {
    return { dedicatedPortal: null, tenantSlug, mode: 'tenant' }
  }

  return { dedicatedPortal: null, tenantSlug: null, mode: 'local' }
}

export function resolvePortalDocumentTitle(
  portal: PortalId,
  entityDisplayName?: string | null,
): string {
  const appName = entityDisplayName?.trim() || brand.appName
  return `${appName} | ${PORTAL_TITLE_SUFFIX[portal]}`
}

export function getPortalDocumentTitle(portal: PortalId): string {
  return PORTAL_DOCUMENT_TITLES[portal]
}

export function isLiveShareDedicatedHost(hostname: string): boolean {
  return normalizeHostname(hostname) === LIVE_SHARE_HOST
}

/** Portal servido por subdomínio dedicado (plataforma ou tenant whitelabel). */
export function getPortalFromHost(hostname: string): PortalId | null {
  return resolveFromTenantContext({ hostname }).dedicatedPortal
}

export function getDedicatedPortal(): PortalId | null {
  return resolveFromTenantContext().dedicatedPortal
}

export function isDedicatedPortal(portal: PortalId): boolean {
  return resolveFromTenantContext().dedicatedPortal === portal
}

/** Prefixo de URL: vazio no host dedicado; `/{portal}` no dev/local multi-portal. */
export function portalBasePath(portal: PortalId): string {
  if (isDedicatedPortal(portal)) return ''
  return `/${portal}`
}

/** Monta path absoluto do portal (`/login` ou `/prefeitura/login`). */
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

/** Redireciona URLs legadas com prefixo `/prefeitura/...` → `/...` no host dedicado. */
export function legacyPrefixedPath(portal: PortalId, pathname: string): string | null {
  if (!isDedicatedPortal(portal)) return null
  const legacyPrefix = `/${portal}`
  if (!pathname.startsWith(`${legacyPrefix}/`) && pathname !== legacyPrefix) return null
  const next = pathname.slice(legacyPrefix.length)
  return next || '/login'
}

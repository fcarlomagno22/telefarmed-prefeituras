import type { ResolvedTenant } from '../../lib/tenant/types.js'

export type PublicTenantPortalKind = 'admin' | 'profissional' | 'prefeitura' | 'ubt'

export type PublicTenantPayload = {
  portalKind: PublicTenantPortalKind
  kind: ResolvedTenant['kind']
  slug: string
  entidadeId: string | null
  ubtId: string | null
  branding: ResolvedTenant['branding']
  loginPath: string
  publicUrl: string | null
}

export function mapTenantToPortalKind(tenant: ResolvedTenant): PublicTenantPortalKind {
  if (tenant.kind === 'gestao') return 'prefeitura'
  if (tenant.kind === 'ubt') return 'ubt'
  return tenant.slug === 'profissional' ? 'profissional' : 'admin'
}

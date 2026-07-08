import { env } from '../../config/env.js'
import type { ResolvedTenant } from '../../lib/tenant/types.js'
import { gestaoPublicUrl, ubtPublicUrl, vdPublicUrl } from '../../lib/tenant/publicUrls.js'
import { isVdPlatformTenant } from '../../lib/tenant/vdPlatformEntity.js'

export type PublicTenantPortalKind = 'admin' | 'profissional' | 'prefeitura' | 'ubt' | 'vd'

export type PublicTenantPayload = {
  portalKind: PublicTenantPortalKind
  kind: ResolvedTenant['kind']
  slug: string
  entidadeId: string | null
  ubtId: string | null
  vdHostSlug: string | null
  branding: ResolvedTenant['branding']
  loginPath: string
  publicUrl: string | null
}

export function mapTenantToPortalKind(tenant: ResolvedTenant): PublicTenantPortalKind {
  if (tenant.kind === 'vd') return 'vd'
  if (tenant.kind === 'gestao') return 'prefeitura'
  if (tenant.kind === 'ubt') return 'ubt'
  return tenant.slug === 'profissional' ? 'profissional' : 'admin'
}

export function publicUrlForTenant(
  tenant: ResolvedTenant,
): string {
  if (tenant.kind === 'platform') {
    return `https://${tenant.slug}.${env.PUBLIC_ROOT_DOMAIN}/login`
  }
  if (tenant.kind === 'gestao') {
    return gestaoPublicUrl(tenant.slug)
  }
  if (tenant.kind === 'vd') {
    if (isVdPlatformTenant(tenant)) {
      return `https://vd.${env.PUBLIC_ROOT_DOMAIN}/`
    }
    return vdPublicUrl(tenant.slug)
  }
  return ubtPublicUrl(tenant.slug)
}

export function loginPathForTenant(tenant: ResolvedTenant): string {
  if (tenant.kind === 'platform') {
    return tenant.slug === 'admin' ? '/admin/login' : '/profissional/login'
  }
  return '/login'
}

export function vdHostSlugForTenant(tenant: ResolvedTenant): string | null {
  if (tenant.kind !== 'vd') return null
  if (isVdPlatformTenant(tenant)) return null
  return `vd-${tenant.slug}`
}

export function toPublicTenantPayload(tenant: ResolvedTenant): PublicTenantPayload {
  return {
    portalKind: mapTenantToPortalKind(tenant),
    kind: tenant.kind,
    slug: tenant.slug,
    entidadeId: tenant.entidadeId ?? null,
    ubtId: tenant.ubtId ?? null,
    vdHostSlug: vdHostSlugForTenant(tenant),
    branding: tenant.branding,
    loginPath: loginPathForTenant(tenant),
    publicUrl: publicUrlForTenant(tenant),
  }
}

import { withCatalogCache } from '../cache/catalogCache.js'
import { getEntidadeBrandingById } from '../entidadeBranding/branding.service.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { buildPlatformTenantBranding, toTenantBranding } from './branding.js'
import {
  extractSubdomainFromHostname,
  isPlatformTenantHost,
} from './hostname.js'
import { normalizeTenantSlugInput } from './slug.js'
import { lookupTenantSlugRedirect } from './slugRedirect.js'
import type { ResolvedTenant } from './types.js'

export type { ResolvedTenant, TenantBranding, TenantKind } from './types.js'
export {
  extractSubdomainFromHostname,
  extractTenantSlugFromHostname,
  isPlatformTenantHost,
  PLATFORM_TENANT_HOST_SLUGS,
} from './hostname.js'

/**
 * Resolve tenant pelo hostname público.
 *
 * Ordem:
 * 1. Hosts fixos admin / profissional → kind platform
 * 2. entidades_contratantes.slug → kind gestao
 * 3. unidades_ubt.slug (+ entidade dona) → kind ubt
 */
export async function resolveTenantByHost(hostname: string): Promise<ResolvedTenant | null> {
  const subdomain = extractSubdomainFromHostname(hostname)
  if (!subdomain) return null

  if (isPlatformTenantHost(subdomain)) {
    return {
      kind: 'platform',
      slug: subdomain,
      branding: buildPlatformTenantBranding(),
    }
  }

  return resolveTenantBySlug(subdomain)
}

export async function resolveTenantBySlug(slugInput: string): Promise<ResolvedTenant | null> {
  const slug = normalizeTenantSlugInput(slugInput)
  if (!slug) return null

  if (isPlatformTenantHost(slug)) {
    return {
      kind: 'platform',
      slug,
      branding: buildPlatformTenantBranding(),
    }
  }

  const redirectSlug = await lookupTenantSlugRedirect(slug)
  if (redirectSlug) {
    return resolveTenantBySlug(redirectSlug)
  }

  return withCatalogCache('tenant', slug, () => resolveTenantBySlugFromDb(slug))
}

async function resolveTenantBySlugFromDb(slug: string): Promise<ResolvedTenant | null> {
  const { data: entidade, error: entidadeError } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (entidadeError) throw entidadeError

  if (entidade) {
    const entidadeId = String(entidade.id)
    const branding = await getEntidadeBrandingById(entidadeId)
    if (!branding) return null

    return {
      kind: 'gestao',
      slug,
      entidadeId,
      branding: toTenantBranding(branding),
    }
  }

  const { data: ubt, error: ubtError } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id, slug, entidade_contratante_id')
    .eq('slug', slug)
    .maybeSingle()

  if (ubtError) throw ubtError
  if (!ubt) return null

  const entidadeId = String(ubt.entidade_contratante_id)
  const branding = await getEntidadeBrandingById(entidadeId)
  if (!branding) return null

  return {
    kind: 'ubt',
    slug,
    entidadeId,
    ubtId: String(ubt.id),
    branding: toTenantBranding(branding),
  }
}

import { withCatalogCache } from '../cache/catalogCache.js'
import { getEntidadeBrandingById } from '../entidadeBranding/branding.service.js'
import { supabaseAdmin } from '../../db/supabase.js'
import {
  extractAppCidadesClientSlug,
  isAppCidadesDedicatedHost,
  isVdPlatformHost,
  normalizeVdTenantEntitySlugInput,
} from './appCidadesHost.js'
import { buildPlatformTenantBranding, toTenantBranding } from './branding.js'
import { resolveVdPlatformEntitySlug } from './vdPlatformEntity.js'
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
export {
  extractAppCidadesClientSlug,
  isAppCidadesDedicatedHost,
  normalizeVdTenantEntitySlugInput,
} from './appCidadesHost.js'

/**
 * Resolve tenant pelo hostname público.
 *
 * Ordem:
 * 1. App cidadão vd / vd-{entidade} → kind vd
 * 2. Hosts fixos admin / profissional → kind platform
 * 3. entidades_contratantes.slug → kind gestao
 * 4. unidades_ubt.slug (+ entidade dona) → kind ubt
 */
export async function resolveTenantByHost(hostname: string): Promise<ResolvedTenant | null> {
  const vdTenant = await resolveVdTenantByHost(hostname)
  if (vdTenant) return vdTenant

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

export async function resolveVdTenantByHost(hostname: string): Promise<ResolvedTenant | null> {
  if (!isAppCidadesDedicatedHost(hostname)) return null

  if (isVdPlatformHost(hostname)) {
    return resolveVdTenantByEntitySlug(resolveVdPlatformEntitySlug())
  }

  const clientSlug = extractAppCidadesClientSlug(hostname)
  if (!clientSlug) return null

  return resolveVdTenantByEntitySlug(clientSlug)
}

export async function resolveVdTenantByEntitySlug(
  slugInput: string,
): Promise<ResolvedTenant | null> {
  const entitySlug = normalizeVdTenantEntitySlugInput(slugInput)
  if (!entitySlug) return null

  const redirectSlug = await lookupTenantSlugRedirect(entitySlug)
  if (redirectSlug) {
    return resolveVdTenantByEntitySlug(redirectSlug)
  }

  return withCatalogCache('tenant', `vd:${entitySlug}`, () =>
    resolveVdTenantByEntitySlugFromDb(entitySlug),
  )
}

async function resolveVdTenantByEntitySlugFromDb(entitySlug: string): Promise<ResolvedTenant | null> {
  const { data: entidade, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('id, slug')
    .eq('slug', entitySlug)
    .maybeSingle()

  if (error) throw error
  if (!entidade) return null

  const entidadeId = String(entidade.id)
  const branding = await getEntidadeBrandingById(entidadeId)
  if (!branding) return null

  return {
    kind: 'vd',
    slug: entitySlug,
    entidadeId,
    branding: toTenantBranding(branding),
  }
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

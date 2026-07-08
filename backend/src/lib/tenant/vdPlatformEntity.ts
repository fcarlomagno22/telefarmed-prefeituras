import { env } from '../../config/env.js'
import type { ResolvedTenant } from './types.js'

/** Slug legado do demo sintético — ignorado; use host vd ou VD_PLATFORM_ENTITY_SLUG. */
export const VD_LEGACY_INTERNAL_DEMO_SLUG = '__vd_internal__'

/** Entidade contratante vinculada a vd.telefarmed.com.br / vd.localhost. */
export const DEFAULT_VD_PLATFORM_ENTITY_SLUG = 'telefarmed-app'

/** UUID fixo da entidade plataforma (migration 20260707230000). */
export const VD_PLATFORM_ENTITY_ID = 'f0000000-0000-4000-8000-000000000001'

export function resolveVdPlatformEntitySlug(): string {
  const configured = env.VD_PLATFORM_ENTITY_SLUG?.trim().toLowerCase()
  return configured || DEFAULT_VD_PLATFORM_ENTITY_SLUG
}

export function isVdPlatformEntitySlug(slug: string | null | undefined): boolean {
  if (!slug?.trim()) return false
  return slug.trim().toLowerCase() === resolveVdPlatformEntitySlug()
}

export function isVdPlatformTenant(tenant: ResolvedTenant): boolean {
  return tenant.kind === 'vd' && isVdPlatformEntitySlug(tenant.slug)
}

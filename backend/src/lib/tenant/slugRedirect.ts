import { supabaseAdmin } from '../../db/supabase.js'
import { isPlatformTenantHost } from './hostname.js'
import { normalizeTenantSlugInput } from './slug.js'

/** Slug antigo em tenant_hosts → redirect_slug (null se expirado ou inexistente). */
export async function lookupTenantSlugRedirect(slugInput: string): Promise<string | null> {
  const slug = normalizeTenantSlugInput(slugInput)
  if (!slug || isPlatformTenantHost(slug)) return null

  const { data, error } = await supabaseAdmin
    .from('tenant_hosts')
    .select('redirect_slug, expires_at')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const expiresAt = data.expires_at ? new Date(String(data.expires_at)) : null
  if (expiresAt && expiresAt.getTime() <= Date.now()) return null

  return String(data.redirect_slug)
}

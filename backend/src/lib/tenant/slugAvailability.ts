import { supabaseAdmin } from '../../db/supabase.js'
import { normalizeTenantSlugInput, validateTenantSlug } from '../tenant/slug.js'

export type SlugAvailabilityResult = {
  value: string
  available: boolean
  reason: string | null
}

export async function checkTenantSlugAvailability(input: {
  value: string
  excludeEntidadeId?: string
  excludeUbtId?: string
}): Promise<SlugAvailabilityResult> {
  const value = normalizeTenantSlugInput(input.value)

  const formatError = validateTenantSlug(value)
  if (formatError) {
    return { value, available: false, reason: formatError }
  }

  const { data: entidade, error: entidadeError } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('id')
    .eq('slug', value)
    .maybeSingle()

  if (entidadeError) throw entidadeError

  if (entidade && String(entidade.id) !== input.excludeEntidadeId) {
    return { value, available: false, reason: 'Este endereço já está em uso por outro cliente.' }
  }

  const { data: ubt, error: ubtError } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id')
    .eq('slug', value)
    .maybeSingle()

  if (ubtError) throw ubtError

  if (ubt && String(ubt.id) !== input.excludeUbtId) {
    return { value, available: false, reason: 'Este endereço já está em uso por uma UBT.' }
  }

  return { value, available: true, reason: null }
}

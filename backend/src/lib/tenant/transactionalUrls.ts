import { supabaseAdmin } from '../../db/supabase.js'
import { resolvePublicAppUrl } from '../codigoVerificacaoDocumento.js'
import { buildGestaoUrl, buildUbtUrl } from './publicUrls.js'

function legacyGestaoPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${resolvePublicAppUrl().replace(/\/$/, '')}/prefeitura${normalized}`
}

function legacyUbtPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${resolvePublicAppUrl().replace(/\/$/, '')}/ubt${normalized}`
}

export async function resolveGestaoUrlForEntidade(
  entidadeId: string,
  path = '/login',
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('slug')
    .eq('id', entidadeId)
    .maybeSingle()

  if (error) throw error
  const slug = data?.slug ? String(data.slug) : ''
  if (slug) return buildGestaoUrl(slug, path)
  return legacyGestaoPath(path)
}

export async function resolveUbtUrlForUnidade(
  unidadeUbtId: string,
  path = '/login',
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .select('slug')
    .eq('id', unidadeUbtId)
    .maybeSingle()

  if (error) throw error
  const slug = data?.slug ? String(data.slug) : ''
  if (slug) return buildUbtUrl(slug, path)
  return legacyUbtPath(path)
}

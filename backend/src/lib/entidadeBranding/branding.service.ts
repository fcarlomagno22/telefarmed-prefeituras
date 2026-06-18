import { supabaseAdmin } from '../../db/supabase.js'
import { resolveCorPrimaria } from './color.js'
import {
  createSignedLogoUrl,
  LOGO_SIGNED_URL_TTL_SECONDS,
  resolveLogoUrlsByEntityId,
} from './logo.service.js'
import { resolveFaviconUrlsByEntityId } from './favicon.service.js'
import {
  resolveLoginBackgroundUrlsByEntityId,
} from './loginBackground.service.js'
import { parseTipoEntidade, resolveEntidadeTerminologia } from './terminology.js'
import type {
  EntidadeBrandingPublic,
  EntidadeBrandingRow,
  EntidadeLogoSignedUrlResponse,
} from './types.js'

const ENTIDADE_BRANDING_COLUMNS =
  'id, nome_exibicao, subtitulo, tipo_entidade, cor_primaria, nome_marca, logo_hue, logo_storage_path, login_background_storage_path, favicon_storage_path, terminologia'

function mapEntidadeBrandingRow(row: Record<string, unknown>): EntidadeBrandingRow {
  return {
    id: String(row.id),
    nome_exibicao: String(row.nome_exibicao ?? ''),
    subtitulo: String(row.subtitulo ?? ''),
    tipo_entidade: parseTipoEntidade(row.tipo_entidade),
    cor_primaria: row.cor_primaria == null ? null : String(row.cor_primaria),
    nome_marca: row.nome_marca == null ? null : String(row.nome_marca),
    logo_hue: Number(row.logo_hue ?? 0),
    logo_storage_path: row.logo_storage_path == null ? null : String(row.logo_storage_path),
    login_background_storage_path:
      row.login_background_storage_path == null
        ? null
        : String(row.login_background_storage_path),
    favicon_storage_path:
      row.favicon_storage_path == null ? null : String(row.favicon_storage_path),
    terminologia: row.terminologia,
  }
}

function buildBrandingPublic(
  row: EntidadeBrandingRow,
  logoUrl: string | null,
  loginBackgroundUrl: string | null,
  faviconUrl: string | null,
): EntidadeBrandingPublic {
  const nomeExibicao = row.nome_exibicao.trim() || row.subtitulo.trim() || 'Entidade'
  const subtitulo = row.subtitulo.trim() || 'Entidade contratante'
  const nomeMarcaRaw = row.nome_marca?.trim() ?? ''
  const nomeMarca = nomeMarcaRaw.length > 0 ? nomeMarcaRaw : null

  return {
    entidadeNomeExibicao: nomeExibicao,
    entidadeSubtitulo: subtitulo,
    entidadeTipo: row.tipo_entidade,
    nomeMarca,
    logoUrl,
    loginBackgroundUrl,
    faviconUrl,
    corPrimaria: resolveCorPrimaria({
      corPrimaria: row.cor_primaria,
      logoHue: row.logo_hue,
    }),
    terminologia: resolveEntidadeTerminologia(row.tipo_entidade, row.terminologia),
  }
}

async function fetchEntidadeBrandingRow(
  entidadeId: string,
): Promise<EntidadeBrandingRow | null> {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select(ENTIDADE_BRANDING_COLUMNS)
    .eq('id', entidadeId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapEntidadeBrandingRow(data as Record<string, unknown>)
}

export async function getEntidadeBrandingById(
  entidadeId: string,
): Promise<EntidadeBrandingPublic | null> {
  const row = await fetchEntidadeBrandingRow(entidadeId)
  if (!row) return null

  const [logoUrls, loginBackgroundUrls, faviconUrls] = await Promise.all([
    resolveLogoUrlsByEntityId([row]),
    resolveLoginBackgroundUrlsByEntityId([row]),
    resolveFaviconUrlsByEntityId([row]),
  ])
  return buildBrandingPublic(
    row,
    logoUrls.get(row.id) ?? null,
    loginBackgroundUrls.get(row.id) ?? null,
    faviconUrls.get(row.id) ?? null,
  )
}

export async function getEntidadeLogoSignedUrlForPortal(
  entidadeId: string,
): Promise<EntidadeLogoSignedUrlResponse> {
  const row = await fetchEntidadeBrandingRow(entidadeId)
  if (!row) {
    return { logoUrl: null, expiresInSeconds: LOGO_SIGNED_URL_TTL_SECONDS }
  }

  const logoUrl = await createSignedLogoUrl(row.logo_storage_path)
  return {
    logoUrl,
    expiresInSeconds: LOGO_SIGNED_URL_TTL_SECONDS,
  }
}

/** Mescla branding da entidade no payload público do usuário do portal. */
export async function attachEntidadeBranding<T extends { entidadeContratanteId: string }>(
  user: T,
): Promise<T & EntidadeBrandingPublic> {
  const branding = await getEntidadeBrandingById(user.entidadeContratanteId)

  if (!branding) {
    return {
      ...user,
      entidadeNomeExibicao: user.entidadeContratanteId,
      entidadeSubtitulo: 'Entidade contratante',
      entidadeTipo: 'prefeitura',
      nomeMarca: null,
      logoUrl: null,
      loginBackgroundUrl: null,
      faviconUrl: null,
      corPrimaria: resolveCorPrimaria({ corPrimaria: null, logoHue: null }),
      terminologia: resolveEntidadeTerminologia('prefeitura', {}),
    }
  }

  return { ...user, ...branding }
}

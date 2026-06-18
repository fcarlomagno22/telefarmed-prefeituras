import { brand } from '../../config/brand'
import { buildEntidadeCopy, type EntidadeCopy } from './copy'
import type {
  EntidadeBrandingFields,
  EntidadeTerminologia,
  EntidadeTerminologiaKey,
} from '../../types/entidadeBranding'
import { buildDefaultEntidadeBranding } from '../../types/entidadeBranding'

export function resolveEntidadeDisplayName(
  branding?: Partial<EntidadeBrandingFields> | null,
): string {
  const nomeMarca = branding?.nomeMarca?.trim()
  if (nomeMarca) return nomeMarca
  const nomeExibicao = branding?.entidadeNomeExibicao?.trim()
  if (nomeExibicao) return nomeExibicao
  return brand.appName
}

export function resolveEntidadeLogoUrl(
  branding?: Partial<EntidadeBrandingFields> | null,
): string {
  const url = branding?.logoUrl?.trim()
  if (url) return url
  return brand.logoUrl
}

export function resolveEntidadeLoginBackgroundUrl(
  branding?: Partial<EntidadeBrandingFields> | null,
  portal: 'prefeitura' | 'ubt' = 'ubt',
): string {
  const url = branding?.loginBackgroundUrl?.trim()
  if (url) return url
  return portal === 'prefeitura'
    ? brand.prefeituraBackgroundImageUrl
    : brand.backgroundImageUrl
}

export function resolveEntidadeCorPrimaria(
  branding?: Partial<EntidadeBrandingFields> | null,
): string {
  const cor = branding?.corPrimaria?.trim()
  if (cor && /^#[0-9a-fA-F]{6}$/.test(cor)) return cor
  return brand.primaryColor
}

export function resolvePlatformOperatorLabel(
  terminologia?: Partial<EntidadeTerminologia> | null,
): string {
  const fromTerm = terminologia?.operador_plataforma?.trim()
  if (fromTerm) {
    return fromTerm.charAt(0).toUpperCase() + fromTerm.slice(1)
  }
  return brand.appName
}

export function resolveTerminologia(
  branding?: Partial<EntidadeBrandingFields> | null,
): EntidadeTerminologia {
  const defaults = buildDefaultEntidadeBranding({ nomeExibicao: '' }).terminologia
  return { ...defaults, ...branding?.terminologia }
}

export function resolveEntidadeCopy(
  key: EntidadeTerminologiaKey,
  terminologia: EntidadeTerminologia,
): string {
  return terminologia[key]
}

export function brandingFieldsFromUser(
  user: Partial<EntidadeBrandingFields> | null | undefined,
): EntidadeBrandingFields | null {
  if (!user?.entidadeNomeExibicao && !user?.corPrimaria && !user?.nomeMarca) {
    return null
  }

  const defaults = buildDefaultEntidadeBranding({
    nomeExibicao: user.entidadeNomeExibicao ?? brand.appName,
    subtitulo: user.entidadeSubtitulo,
    tipo: user.entidadeTipo,
  })

  return {
    ...defaults,
    entidadeNomeExibicao: user.entidadeNomeExibicao ?? defaults.entidadeNomeExibicao,
    entidadeSubtitulo: user.entidadeSubtitulo ?? defaults.entidadeSubtitulo,
    entidadeTipo: user.entidadeTipo ?? defaults.entidadeTipo,
    nomeMarca: user.nomeMarca ?? defaults.nomeMarca,
    logoUrl: user.logoUrl ?? defaults.logoUrl,
    loginBackgroundUrl: user.loginBackgroundUrl ?? defaults.loginBackgroundUrl,
    faviconUrl: user.faviconUrl ?? defaults.faviconUrl,
    corPrimaria: resolveEntidadeCorPrimaria(user),
    terminologia: resolveTerminologia(user),
  }
}

export function buildEntidadeBrandingPresentation(
  branding: EntidadeBrandingFields | null,
) {
  const terminologia = branding ? resolveTerminologia(branding) : resolveTerminologia(null)
  const entidadeTipo = branding?.entidadeTipo ?? 'prefeitura'
  const copy = buildEntidadeCopy(terminologia, entidadeTipo)
  return {
    branding,
    displayName: resolveEntidadeDisplayName(branding),
    logoUrl: resolveEntidadeLogoUrl(branding),
    corPrimaria: resolveEntidadeCorPrimaria(branding),
    terminologia,
    copy,
    platformOperatorLabel: resolvePlatformOperatorLabel(terminologia),
  }
}

export type { EntidadeCopy }

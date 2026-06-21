import { brand } from '../../config/brand'
import {
  buildDefaultEntidadeBranding,
  type EntidadeBrandingFields,
} from '../../types/entidadeBranding'

/**
 * UBT sem slug de tenant (`ubt.telefarmed.com.br` ou `localhost/ubt/`).
 * Identidade visual 100% Telefarmed — como se a plataforma fosse cliente dela mesma.
 */
export function isPlatformUbtWithoutTenantSlug(
  tenantSlug: string | null | undefined,
): boolean {
  return !tenantSlug?.trim()
}

/** Branding fixo Telefarmed para o host de plataforma UBT sem whitelabel de cliente. */
export function buildTelefarmedSelfBranding(): EntidadeBrandingFields {
  const defaults = buildDefaultEntidadeBranding({
    nomeExibicao: brand.appName,
    subtitulo: brand.appTagline,
    tipo: 'generico',
  })

  return {
    ...defaults,
    nomeMarca: brand.appName,
    logoUrl: brand.logoUrl,
    loginBackgroundUrl: brand.backgroundImageUrl,
    faviconUrl: brand.faviconUrl,
    corPrimaria: brand.primaryColor,
    terminologia: {
      ...defaults.terminologia,
      operador_plataforma: brand.appName,
    },
  }
}

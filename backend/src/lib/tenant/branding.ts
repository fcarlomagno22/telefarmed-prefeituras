import type { EntidadeBrandingPublic } from '../entidadeBranding/types.js'
import { resolveEntidadeTerminologia } from '../entidadeBranding/terminology.js'
import type { TenantBranding } from './types.js'

const PLATFORM_PRIMARY_COLOR = '#ff6b00'

export function toTenantBranding(branding: EntidadeBrandingPublic): TenantBranding {
  return {
    logoUrl: branding.logoUrl,
    loginBackgroundUrl: branding.loginBackgroundUrl,
    faviconUrl: branding.faviconUrl,
    corPrimaria: branding.corPrimaria,
    nomeMarca: branding.nomeMarca ?? branding.entidadeNomeExibicao,
    terminologia: branding.terminologia,
    tipoEntidade: branding.entidadeTipo,
  }
}

export function buildPlatformTenantBranding(): TenantBranding {
  const tipoEntidade = 'generico' as const
  return {
    logoUrl: null,
    loginBackgroundUrl: null,
    faviconUrl: null,
    corPrimaria: PLATFORM_PRIMARY_COLOR,
    nomeMarca: 'Telefarmed',
    terminologia: resolveEntidadeTerminologia(tipoEntidade, null),
    tipoEntidade,
  }
}

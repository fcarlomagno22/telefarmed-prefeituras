import { useMemo } from 'react'
import { brand } from '../config/brand'
import { getDedicatedPortal } from '../config/portalHost'
import { portals, type PortalId } from '../config/portals'
import { useEntidadeBranding } from '../contexts/EntidadeBrandingContext'
import { useOptionalTenantHost } from '../contexts/TenantHostContext'
import { useEntidadeBrandTheme } from './useEntidadeBrandTheme'
import { resolveEntidadeLoginBackgroundUrl } from '../lib/entidadeBranding/resolve'
import { isPlatformUbtWithoutTenantSlug } from '../lib/entidadeBranding/platformUbtBranding'

type TenantLoginPortal = Extract<PortalId, 'prefeitura' | 'ubt'>

function isTenantLoginPortal(portal: PortalId): portal is TenantLoginPortal {
  return portal === 'prefeitura' || portal === 'ubt'
}

function isWhitelabelUbtTenant(
  portal: PortalId,
  tenantKind: string | null | undefined,
): boolean {
  return portal === 'ubt' && tenantKind === 'ubt'
}

function resolveLoginPortalPublicUrl(
  tenantPublicUrl: string | null | undefined,
  tenantSlug: string | null | undefined,
): string | null {
  const trimmed = tenantPublicUrl?.trim()
  if (trimmed) return trimmed

  if (typeof window === 'undefined') return null
  if (!tenantSlug && !getDedicatedPortal()) return null

  return `${window.location.protocol}//${window.location.host}`
}

/** Branding whitelabel + URL pública para telas de login (antes da autenticação). */
export function useTenantLoginBranding(portal: PortalId) {
  const entidadeBranding = useEntidadeBranding()
  const tenantHost = useOptionalTenantHost()
  const portalConfig = portals[portal]
  const whitelabelUbtTenant = isWhitelabelUbtTenant(portal, tenantHost?.tenant?.kind)
  const platformUbtSelfBranding =
    portal === 'ubt' && isPlatformUbtWithoutTenantSlug(tenantHost?.slug)

  const portalPublicUrl = useMemo(
    () => {
      if (platformUbtSelfBranding) return null
      return isTenantLoginPortal(portal) && !whitelabelUbtTenant
        ? resolveLoginPortalPublicUrl(tenantHost?.tenant?.publicUrl, tenantHost?.slug)
        : null
    },
    [
      platformUbtSelfBranding,
      portal,
      tenantHost?.slug,
      tenantHost?.tenant?.publicUrl,
      whitelabelUbtTenant,
    ],
  )

  const hasTenantBranding = Boolean(
    !platformUbtSelfBranding &&
      isTenantLoginPortal(portal) &&
      (tenantHost?.prefetchBranding ?? tenantHost?.tenant?.branding?.nomeMarca),
  )

  useEntidadeBrandTheme()

  const welcomeTitle = useMemo(() => {
    if (portal === 'prefeitura') return portalConfig.welcomeTitle
    if (platformUbtSelfBranding) return portalConfig.welcomeTitle
    if (whitelabelUbtTenant) {
      return portalConfig.tenantWelcomeTitle ?? 'Unidade de Teleatendimento'
    }
    if (hasTenantBranding && entidadeBranding.displayName !== brand.appName) {
      return entidadeBranding.displayName
    }
    return portalConfig.welcomeTitle
  }, [
    entidadeBranding.displayName,
    hasTenantBranding,
    platformUbtSelfBranding,
    portal,
    portalConfig.tenantWelcomeTitle,
    portalConfig.welcomeTitle,
    whitelabelUbtTenant,
  ])

  const welcomeSubtitle = useMemo(() => {
    if (portal === 'prefeitura') return portalConfig.welcomeSubtitle
    if (platformUbtSelfBranding) return portalConfig.welcomeSubtitle
    if (whitelabelUbtTenant) {
      return portalConfig.tenantWelcomeSubtitle ?? 'Faça o login com suas credenciais'
    }
    if (portalPublicUrl) return portalPublicUrl
    return portalConfig.welcomeSubtitle
  }, [
    platformUbtSelfBranding,
    portal,
    portalConfig.tenantWelcomeSubtitle,
    portalConfig.welcomeSubtitle,
    portalPublicUrl,
    whitelabelUbtTenant,
  ])

  const headline = useMemo(() => {
    if (platformUbtSelfBranding || whitelabelUbtTenant) return brand.headline
    if (hasTenantBranding && entidadeBranding.displayName !== brand.appName) {
      return entidadeBranding.displayName
    }
    return brand.headline
  }, [entidadeBranding.displayName, hasTenantBranding, platformUbtSelfBranding, whitelabelUbtTenant])

  const subheadline = useMemo(() => {
    if (platformUbtSelfBranding) return brand.subheadline
    if (whitelabelUbtTenant) return brand.subheadline
    if (portalPublicUrl) return portalPublicUrl
    return brand.subheadline
  }, [platformUbtSelfBranding, portalPublicUrl, whitelabelUbtTenant])

  const loginBackgroundUrl = useMemo(() => {
    if (platformUbtSelfBranding) return brand.backgroundImageUrl
    if (whitelabelUbtTenant) {
      return brand.ubtClientLoginBackgroundUrl
    }
    const fromTenant = tenantHost?.tenant?.branding?.loginBackgroundUrl?.trim()
    if (fromTenant) return fromTenant
    return resolveEntidadeLoginBackgroundUrl(entidadeBranding.branding, portal)
  }, [
    entidadeBranding.branding,
    platformUbtSelfBranding,
    portal,
    tenantHost?.tenant?.branding?.loginBackgroundUrl,
    whitelabelUbtTenant,
  ])

  return {
    displayName: platformUbtSelfBranding ? brand.appName : entidadeBranding.displayName,
    logoUrl: platformUbtSelfBranding ? brand.logoUrl : entidadeBranding.logoUrl,
    loginBackgroundUrl,
    welcomeTitle,
    welcomeSubtitle,
    headline,
    subheadline,
    portalPublicUrl,
    hasTenantBranding,
    whitelabelUbtTenant,
    platformUbtSelfBranding,
  }
}

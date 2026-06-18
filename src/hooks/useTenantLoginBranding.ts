import { useMemo } from 'react'
import { brand } from '../config/brand'
import { getDedicatedPortal } from '../config/portalHost'
import { portals, type PortalId } from '../config/portals'
import { useEntidadeBranding } from '../contexts/EntidadeBrandingContext'
import { useOptionalTenantHost } from '../contexts/TenantHostContext'
import { useEntidadeBrandTheme } from './useEntidadeBrandTheme'
import { resolveEntidadeLoginBackgroundUrl } from '../lib/entidadeBranding/resolve'

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

  const portalPublicUrl = useMemo(
    () =>
      isTenantLoginPortal(portal) && !whitelabelUbtTenant
        ? resolveLoginPortalPublicUrl(tenantHost?.tenant?.publicUrl, tenantHost?.slug)
        : null,
    [portal, tenantHost?.slug, tenantHost?.tenant?.publicUrl, whitelabelUbtTenant],
  )

  const hasTenantBranding = Boolean(
    isTenantLoginPortal(portal) &&
      (tenantHost?.prefetchBranding ?? tenantHost?.tenant?.branding?.nomeMarca),
  )

  useEntidadeBrandTheme()

  const welcomeTitle = useMemo(() => {
    if (portal === 'prefeitura') return portalConfig.welcomeTitle
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
    portal,
    portalConfig.tenantWelcomeTitle,
    portalConfig.welcomeTitle,
    whitelabelUbtTenant,
  ])

  const welcomeSubtitle = useMemo(() => {
    if (portal === 'prefeitura') return portalConfig.welcomeSubtitle
    if (whitelabelUbtTenant) {
      return portalConfig.tenantWelcomeSubtitle ?? 'Faça o login com suas credenciais'
    }
    if (portalPublicUrl) return portalPublicUrl
    return portalConfig.welcomeSubtitle
  }, [
    portal,
    portalConfig.tenantWelcomeSubtitle,
    portalConfig.welcomeSubtitle,
    portalPublicUrl,
    whitelabelUbtTenant,
  ])

  const headline = useMemo(() => {
    if (whitelabelUbtTenant) return brand.headline
    if (hasTenantBranding && entidadeBranding.displayName !== brand.appName) {
      return entidadeBranding.displayName
    }
    return brand.headline
  }, [entidadeBranding.displayName, hasTenantBranding, whitelabelUbtTenant])

  const subheadline = useMemo(() => {
    if (whitelabelUbtTenant) return brand.subheadline
    if (portalPublicUrl) return portalPublicUrl
    return brand.subheadline
  }, [portalPublicUrl, whitelabelUbtTenant])

  const loginBackgroundUrl = useMemo(() => {
    if (whitelabelUbtTenant) {
      return brand.ubtClientLoginBackgroundUrl
    }
    const fromTenant = tenantHost?.tenant?.branding?.loginBackgroundUrl?.trim()
    if (fromTenant) return fromTenant
    return resolveEntidadeLoginBackgroundUrl(entidadeBranding.branding, portal)
  }, [entidadeBranding.branding, portal, tenantHost?.tenant?.branding?.loginBackgroundUrl, whitelabelUbtTenant])

  return {
    displayName: entidadeBranding.displayName,
    logoUrl: entidadeBranding.logoUrl,
    loginBackgroundUrl,
    welcomeTitle,
    welcomeSubtitle,
    headline,
    subheadline,
    portalPublicUrl,
    hasTenantBranding,
    whitelabelUbtTenant,
  }
}

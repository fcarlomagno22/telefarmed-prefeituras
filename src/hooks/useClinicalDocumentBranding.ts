import { useMemo } from 'react'
import { brand } from '../config/brand'
import { useOptionalEntidadeBranding } from '../contexts/EntidadeBrandingContext'
import { useTenantHost } from '../contexts/TenantHostContext'
import {
  buildEntidadeBrandingPresentation,
  resolveEntidadeDisplayName,
} from '../lib/entidadeBranding/resolve'
import { resolveClinicalDocumentLogoUrl } from '../utils/clinicalDocuments/resolveClinicalDocumentLogoUrl'
import type { EntidadeBrandingFields } from '../types/entidadeBranding'

function resolveClientLogoUrl(fields: EntidadeBrandingFields | null): string | undefined {
  const rawLogo = fields?.logoUrl?.trim()
  if (!rawLogo) return undefined
  if (rawLogo === brand.logoUrl) return undefined
  return resolveClinicalDocumentLogoUrl(rawLogo)
}

export function useClinicalDocumentBranding() {
  const entidadeBranding = useOptionalEntidadeBranding()
  const tenantHost = useTenantHost()

  return useMemo(() => {
    const fields = entidadeBranding?.branding ?? tenantHost.prefetchBranding
    const presentation = buildEntidadeBrandingPresentation(fields)

    return {
      displayName: resolveEntidadeDisplayName(fields),
      logoUrl: resolveClientLogoUrl(fields),
      corPrimaria: presentation.corPrimaria,
      isReady: entidadeBranding != null || tenantHost.status !== 'loading',
      source: entidadeBranding ? ('session' as const) : tenantHost.prefetchBranding ? ('tenant' as const) : ('default' as const),
    }
  }, [entidadeBranding, tenantHost.prefetchBranding, tenantHost.status])
}

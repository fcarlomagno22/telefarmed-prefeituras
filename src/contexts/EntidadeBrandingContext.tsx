import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { brand } from '../config/brand'
import { useOptionalPrefeituraAuth } from './PrefeituraAuthContext'
import { useOptionalUbtAuth } from './UbtAuthContext'
import { isBackendApiEnabled } from '../lib/api/config'
import { apiPrefeituraEntidadeBranding, apiPrefeituraEntidadeLogo } from '../lib/api/prefeitura/auth'
import { apiUbtEntidadeBranding, apiUbtEntidadeLogo } from '../lib/api/ubt/auth'
import { useEntidadeBrandTheme } from '../hooks/useEntidadeBrandTheme'
import {
  brandingFieldsFromUser,
  buildEntidadeBrandingPresentation,
} from '../lib/entidadeBranding/resolve'
import {
  entidadeExportBrandingFromFields,
  setEntidadeExportBranding,
} from '../utils/entidadeExportHtml'
import { useEntidadeDocumentTitle } from '../hooks/useAppDocumentTitle'
import { useTenantFavicon } from '../hooks/useTenantFavicon'
import type { PortalId } from '../config/portalHost'
import { useOptionalTenantHost } from './TenantHostContext'

export type EntidadeBrandingPortal = Extract<PortalId, 'prefeitura' | 'ubt'>

type EntidadeBrandingPresentation = ReturnType<typeof buildEntidadeBrandingPresentation>

type EntidadeBrandingContextValue = EntidadeBrandingPresentation & {
  refreshBranding: () => Promise<void>
}

const defaultPresentation = buildEntidadeBrandingPresentation(null)

const EntidadeBrandingContext = createContext<EntidadeBrandingContextValue | null>(null)

function EntidadeBrandThemeSync() {
  useEntidadeBrandTheme()
  return null
}

function EntidadeBrandingDocumentHead({
  portal,
  displayName,
  faviconUrl,
}: {
  portal: EntidadeBrandingPortal
  displayName: string
  faviconUrl: string | null | undefined
}) {
  useEntidadeDocumentTitle(displayName)
  useTenantFavicon(faviconUrl)
  return null
}

type EntidadeBrandingProviderProps = {
  portal: EntidadeBrandingPortal
  children: ReactNode
}

export function EntidadeBrandingProvider({ portal, children }: EntidadeBrandingProviderProps) {
  const prefeituraAuth = useOptionalPrefeituraAuth()
  const ubtAuth = useOptionalUbtAuth()
  const auth = portal === 'prefeitura' ? prefeituraAuth : ubtAuth
  const user = auth?.user ?? null
  const accessToken = auth?.accessToken ?? null
  const tenantHost = useOptionalTenantHost()

  const [branding, setBranding] = useState<EntidadeBrandingFields | null>(() =>
    brandingFieldsFromUser(user) ?? tenantHost?.prefetchBranding ?? null,
  )
  const logoExpiresAtRef = useRef(0)

  const syncFromUser = useCallback(() => {
    setBranding(brandingFieldsFromUser(user))
  }, [user])

  useEffect(() => {
    syncFromUser()
  }, [syncFromUser])

  const refreshBranding = useCallback(async () => {
    if (!accessToken) {
      syncFromUser()
      return
    }

    if (isBackendApiEnabled()) {
      try {
        const fetchBranding =
          portal === 'prefeitura' ? apiPrefeituraEntidadeBranding : apiUbtEntidadeBranding
        const { branding: remote } = await fetchBranding(accessToken)
        setBranding(remote)
      } catch {
        syncFromUser()
      }
    } else {
      syncFromUser()
    }

    const shouldRefreshLogo =
      !logoExpiresAtRef.current || Date.now() >= logoExpiresAtRef.current - 60_000

    if (!shouldRefreshLogo || !isBackendApiEnabled()) return

    try {
      const fetchLogo = portal === 'prefeitura' ? apiPrefeituraEntidadeLogo : apiUbtEntidadeLogo
      const { logoUrl, expiresInSeconds } = await fetchLogo(accessToken)
      logoExpiresAtRef.current = Date.now() + expiresInSeconds * 1000
      if (logoUrl) {
        setBranding((current) => {
          const base = current ?? brandingFieldsFromUser(user)
          if (!base) return current
          return { ...base, logoUrl }
        })
      }
    } catch {
      // Mantém logo do /me ou fallback estático.
    }
  }, [accessToken, portal, syncFromUser, user])

  useEffect(() => {
    if (!auth?.isAuthenticated) {
      logoExpiresAtRef.current = 0
      setBranding(tenantHost?.prefetchBranding ?? null)
      return
    }
    void refreshBranding()
  }, [auth?.isAuthenticated, refreshBranding, tenantHost?.prefetchBranding, user?.entidadeContratanteId])

  const presentation = useMemo(
    () => buildEntidadeBrandingPresentation(branding),
    [branding],
  )

  const value = useMemo<EntidadeBrandingContextValue>(
    () => ({
      ...presentation,
      refreshBranding,
    }),
    [presentation, refreshBranding],
  )

  useEffect(() => {
    setEntidadeExportBranding(entidadeExportBrandingFromFields(presentation.branding))
    return () => setEntidadeExportBranding(null)
  }, [presentation.branding])

  return (
    <EntidadeBrandingContext.Provider value={value}>
      <EntidadeBrandThemeSync />
      <EntidadeBrandingDocumentHead
        portal={portal}
        displayName={presentation.displayName}
        faviconUrl={presentation.branding?.faviconUrl}
      />
      {children}
    </EntidadeBrandingContext.Provider>
  )
}

export function useOptionalEntidadeBranding(): EntidadeBrandingContextValue | null {
  return useContext(EntidadeBrandingContext)
}

export function useEntidadeBranding(): EntidadeBrandingContextValue {
  const context = useContext(EntidadeBrandingContext)
  if (context) return context
  return {
    ...defaultPresentation,
    refreshBranding: async () => {},
  }
}

export function useEntidadeReportPresentation() {
  const { displayName, logoUrl, corPrimaria } = useEntidadeBranding()
  return {
    brandName: displayName,
    logoUrl,
    corPrimaria,
  }
}

export function useEntidadePortalAppName(): string {
  return useEntidadeBranding().displayName || brand.appName
}

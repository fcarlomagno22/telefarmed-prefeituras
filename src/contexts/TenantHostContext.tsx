import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { extractTenantSlugFromHostname } from '../config/tenantHost'
import { brand } from '../config/brand'
import { getDedicatedPortal } from '../config/portalHost'
import { applyBrandCssVariables } from '../utils/brandColor'
import {
  syncPortalHostContext,
  syncPortalHostContextFromWindow,
} from '../config/portalHost'
import { fetchPublicTenant } from '../lib/api/public/tenant'
import { useTenantFavicon } from '../hooks/useTenantFavicon'
import { useFallbackDocumentTitle } from '../hooks/useAppDocumentTitle'
import type { PublicTenantResponse, TenantHostStatus } from '../types/tenantHost'
import type { EntidadeBrandingFields } from '../types/entidadeBranding'

type TenantHostContextValue = {
  slug: string | null
  status: TenantHostStatus
  tenant: PublicTenantResponse | null
  prefetchBranding: EntidadeBrandingFields | null
  reload: () => Promise<void>
}

const TenantHostContext = createContext<TenantHostContextValue | null>(null)

function mapPublicBrandingToFields(
  tenant: PublicTenantResponse | null,
): EntidadeBrandingFields | null {
  if (!tenant) return null
  const branding = tenant.branding
  return {
    entidadeNomeExibicao: branding.nomeMarca?.trim() || 'Entidade',
    entidadeSubtitulo: '',
    entidadeTipo: branding.tipoEntidade,
    nomeMarca: branding.nomeMarca,
    logoUrl: branding.logoUrl,
    loginBackgroundUrl: branding.loginBackgroundUrl ?? null,
    faviconUrl: branding.faviconUrl ?? null,
    corPrimaria: branding.corPrimaria,
    terminologia: branding.terminologia,
  }
}

function TenantHostDocumentHead({ faviconUrl }: { faviconUrl: string | null | undefined }) {
  useFallbackDocumentTitle()
  useTenantFavicon(faviconUrl)
  return null
}

export function TenantHostProvider({ children }: { children: ReactNode }) {
  const slug = useMemo(() => {
    if (typeof window === 'undefined') return null
    return extractTenantSlugFromHostname(window.location.hostname)
  }, [])

  const [status, setStatus] = useState<TenantHostStatus>(slug ? 'loading' : 'idle')
  const [tenant, setTenant] = useState<PublicTenantResponse | null>(null)

  const reload = async () => {
    if (!slug) {
      setTenant(null)
      setStatus('idle')
      return
    }

    setStatus('loading')
    try {
      const data = await fetchPublicTenant({ slug })
      setTenant(data)
      setStatus('ready')
    } catch (error) {
      if (error instanceof Error && error.message === 'TENANT_NOT_FOUND') {
        setTenant(null)
        setStatus('not_found')
        return
      }
      setTenant(null)
      setStatus('error')
    }
  }

  useEffect(() => {
    void reload()
  }, [slug])

  useEffect(() => {
    if (status !== 'ready' || !tenant) {
      if (!slug && getDedicatedPortal() === 'ubt') {
        applyBrandCssVariables(brand.primaryColor)
      }
      return
    }
    if (tenant.kind === 'gestao' || tenant.kind === 'ubt') {
      applyBrandCssVariables(tenant.branding.corPrimaria)
      return
    }
    applyBrandCssVariables(brand.primaryColor)
  }, [slug, status, tenant])

  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''

  if (slug && tenant && status === 'ready') {
    syncPortalHostContext({
      hostname,
      tenantSlug: slug,
      tenantKind: tenant.kind,
      portalKind: tenant.portalKind,
    })
  } else if (!slug) {
    syncPortalHostContextFromWindow()
  }

  useEffect(() => {
    if (slug && tenant && status === 'ready') {
      syncPortalHostContext({
        hostname,
        tenantSlug: slug,
        tenantKind: tenant.kind,
        portalKind: tenant.portalKind,
      })
      return
    }

    if (!slug) {
      syncPortalHostContextFromWindow()
    }
  }, [hostname, slug, status, tenant])

  const value = useMemo<TenantHostContextValue>(
    () => ({
      slug,
      status,
      tenant,
      prefetchBranding: mapPublicBrandingToFields(tenant),
      reload,
    }),
    [slug, status, tenant],
  )

  const platformUbtFavicon =
    !slug && getDedicatedPortal() === 'ubt' ? brand.faviconUrl : tenant?.branding?.faviconUrl

  return (
    <TenantHostContext.Provider value={value}>
      <TenantHostDocumentHead faviconUrl={platformUbtFavicon} />
      {children}
    </TenantHostContext.Provider>
  )
}

export function useOptionalTenantHost(): TenantHostContextValue | null {
  return useContext(TenantHostContext)
}

export function useTenantHost(): TenantHostContextValue {
  const context = useContext(TenantHostContext)
  if (!context) {
    return {
      slug: null,
      status: 'idle',
      tenant: null,
      prefetchBranding: null,
      reload: async () => {},
    }
  }
  return context
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native'
import { fallbackBranding } from '../config/fallbackBranding'
import { syncRuntimeBranding } from '../config/runtimeBranding'
import { resolveVdTenantHostHeader, resolveVdTenantSlug, shouldFetchVdTenant } from '../config/tenantHost'
import { fetchTenant, setVdApiTenantScope } from '../lib/api/vd'
import { normalizePrimaryColor } from '../utils/brandColor'
import type { VdPublicTenantResponse, VdTenantStatus } from '../types/vdTenant'

export type VdTenantBranding = {
  logoUrl: string | null
  loginBackgroundUrl: string | null
  faviconUrl: string | null
  corPrimaria: string
  municipalityName: string
}

export type VdTenantContextValue = {
  slug: string | null
  status: VdTenantStatus
  entidadeId: string | null
  tenant: VdPublicTenantResponse | null
  branding: VdTenantBranding
  isRuntimeBranding: boolean
  reload: () => Promise<void>
}

const TenantContext = createContext<VdTenantContextValue | null>(null)

function mapTenantToBranding(tenant: VdPublicTenantResponse): VdTenantBranding {
  const branding = tenant.branding
  return {
    logoUrl: branding.logoUrl,
    loginBackgroundUrl: branding.loginBackgroundUrl,
    faviconUrl: branding.faviconUrl,
    corPrimaria: normalizePrimaryColor(branding.corPrimaria),
    municipalityName:
      branding.nomeMarca?.trim() || fallbackBranding.municipalityName,
  }
}

function buildFallbackBranding(): VdTenantBranding {
  return {
    logoUrl: fallbackBranding.logoUrl || null,
    loginBackgroundUrl: fallbackBranding.loginBackgroundUrl || null,
    faviconUrl: fallbackBranding.faviconUrl,
    corPrimaria: normalizePrimaryColor(fallbackBranding.corPrimaria),
    municipalityName: fallbackBranding.municipalityName,
  }
}

function applyWebTenantDocumentHead(branding: VdTenantBranding) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return

  document.title = `Telefarmed ${branding.municipalityName}`

  const faviconUrl = branding.faviconUrl?.trim()
  if (!faviconUrl) return

  let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = faviconUrl
}

type TenantProviderProps = {
  children: ReactNode
}

export function TenantProvider({ children }: TenantProviderProps) {
  const slug = useMemo(() => resolveVdTenantSlug(), [])
  const hostHeader = useMemo(() => resolveVdTenantHostHeader(), [])
  const shouldLoadTenant = useMemo(
    () => shouldFetchVdTenant({ slug, hostHeader }),
    [hostHeader, slug],
  )

  const [status, setStatus] = useState<VdTenantStatus>(shouldLoadTenant ? 'loading' : 'idle')
  const [tenant, setTenant] = useState<VdPublicTenantResponse | null>(null)

  const reload = useCallback(async () => {
    if (!shouldLoadTenant) {
      setTenant(null)
      setStatus('idle')
      return
    }

    setStatus('loading')
    try {
      const data = await fetchTenant({
        slug: slug ?? undefined,
        host: hostHeader,
      })
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
  }, [hostHeader, shouldLoadTenant, slug])

  useEffect(() => {
    void reload()
  }, [reload])

  const branding = useMemo(
    () => (tenant ? mapTenantToBranding(tenant) : buildFallbackBranding()),
    [tenant],
  )

  const isRuntimeBranding = status === 'ready' && tenant !== null

  useEffect(() => {
    syncRuntimeBranding(branding)
    applyWebTenantDocumentHead(branding)

    if (tenant && status === 'ready') {
      setVdApiTenantScope({
        slug: tenant.slug,
        host: hostHeader,
      })
      return
    }

    if (slug || hostHeader) {
      setVdApiTenantScope({
        slug: slug ?? undefined,
        host: hostHeader,
      })
      return
    }

    setVdApiTenantScope(null)
  }, [branding, hostHeader, slug, status, tenant])

  const value = useMemo<VdTenantContextValue>(
    () => ({
      slug,
      status,
      entidadeId: tenant?.entidadeId ?? null,
      tenant,
      branding,
      isRuntimeBranding,
      reload,
    }),
    [branding, isRuntimeBranding, reload, slug, status, tenant],
  )

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant(): VdTenantContextValue {
  const context = useContext(TenantContext)
  if (!context) {
    return {
      slug: null,
      status: 'idle',
      entidadeId: null,
      tenant: null,
      branding: buildFallbackBranding(),
      isRuntimeBranding: false,
      reload: async () => {},
    }
  }
  return context
}

type TenantBootstrapGateProps = {
  children: ReactNode
}

export function TenantBootstrapGate({ children }: TenantBootstrapGateProps) {
  const { status } = useTenant()

  if (status === 'loading') {
    return (
      <View style={styles.loadingShell}>
        <ActivityIndicator size="large" color={fallbackBranding.corPrimaria} />
      </View>
    )
  }

  if (status === 'not_found') {
    return (
      <View style={styles.errorShell}>
        <Text style={styles.errorTitle}>App não encontrado</Text>
        <Text style={styles.errorMessage}>
          Este endereço não está vinculado a um município ativo. Verifique o link ou entre em
          contato com a prefeitura.
        </Text>
      </View>
    )
  }

  if (status === 'error') {
    return (
      <View style={styles.errorShell}>
        <Text style={styles.errorTitle}>Não foi possível carregar o app</Text>
        <Text style={styles.errorMessage}>
          Verifique sua conexão e tente novamente em instantes.
        </Text>
      </View>
    )
  }

  return children
}

const styles = StyleSheet.create({
  loadingShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f7',
  },
  errorShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#f5f5f7',
    gap: 12,
  },
  errorTitle: {
    color: '#1a1a1f',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorMessage: {
    color: 'rgba(26, 26, 31, 0.65)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
})

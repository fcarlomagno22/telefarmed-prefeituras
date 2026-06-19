import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { resolveDocumentTitle } from '../config/documentTitle'
import { resolveEntidadeDisplayName } from '../lib/entidadeBranding/resolve'
import { useTenantHost } from '../contexts/TenantHostContext'

let entidadeDocumentTitleActive = false

function resolveTenantDisplayName(
  prefetchBranding: ReturnType<typeof useTenantHost>['prefetchBranding'],
): string | null {
  if (!prefetchBranding) return null
  return resolveEntidadeDisplayName(prefetchBranding)
}

/** Título da aba para portais com branding de entidade (prefeitura / UBT). */
export function useEntidadeDocumentTitle(displayName: string) {
  const { pathname } = useLocation()

  useEffect(() => {
    entidadeDocumentTitleActive = true
    document.title = resolveDocumentTitle(displayName)
    return () => {
      entidadeDocumentTitleActive = false
    }
  }, [displayName, pathname])
}

/** Título padrão: Telefarmed ou whitelabel do host, quando não há portal de entidade ativo. */
export function useFallbackDocumentTitle() {
  const { pathname } = useLocation()
  const tenantHost = useTenantHost()

  useEffect(() => {
    if (entidadeDocumentTitleActive) return

    document.title = resolveDocumentTitle(resolveTenantDisplayName(tenantHost.prefetchBranding))
  }, [pathname, tenantHost.prefetchBranding])
}

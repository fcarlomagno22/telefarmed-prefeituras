import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { PortalId } from '../config/portals'
import { useOptionalAdminAuth } from '../contexts/AdminAuthContext'
import { useOptionalPrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import { useOptionalProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import { useOptionalUbtAuth } from '../contexts/UbtAuthContext'
import {
  prefetchAdminCatalogs,
  prefetchPrefeituraCatalogs,
  prefetchProfissionalCatalogs,
  prefetchUbtCatalogs,
} from '../lib/query/prefetchCatalogs'

export function usePortalCatalogPrefetch(portal: PortalId) {
  const queryClient = useQueryClient()
  const adminAuth = useOptionalAdminAuth()
  const prefeituraAuth = useOptionalPrefeituraAuth()
  const ubtAuth = useOptionalUbtAuth()
  const profissionalAuth = useOptionalProfissionalAuth()

  useEffect(() => {
    if (portal === 'admin') {
      if (adminAuth?.isBootstrapping || !adminAuth?.isAuthenticated) return
      const token = adminAuth.getAccessToken()
      if (!token) return
      void prefetchAdminCatalogs(queryClient, token)
      return
    }

    if (portal === 'prefeitura') {
      if (prefeituraAuth?.isBootstrapping || !prefeituraAuth?.isAuthenticated) return
      const token = prefeituraAuth.getAccessToken()
      if (!token) return
      void prefetchPrefeituraCatalogs(queryClient, token)
      return
    }

    if (portal === 'ubt') {
      if (ubtAuth?.isBootstrapping || !ubtAuth?.isAuthenticated) return
      void prefetchUbtCatalogs(queryClient)
      return
    }

    if (portal === 'profissional') {
      if (profissionalAuth?.isBootstrapping || !profissionalAuth?.isAuthenticated) return
      const token = profissionalAuth.getAccessToken()
      if (!token) return
      void prefetchProfissionalCatalogs(queryClient, token)
    }
  }, [
    adminAuth?.getAccessToken,
    adminAuth?.isAuthenticated,
    adminAuth?.isBootstrapping,
    portal,
    prefeituraAuth?.getAccessToken,
    prefeituraAuth?.isAuthenticated,
    prefeituraAuth?.isBootstrapping,
    profissionalAuth?.getAccessToken,
    profissionalAuth?.isAuthenticated,
    profissionalAuth?.isBootstrapping,
    queryClient,
    ubtAuth?.isAuthenticated,
    ubtAuth?.isBootstrapping,
  ])
}

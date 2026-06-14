import { useCallback, useEffect, useState } from 'react'
import { useOptionalPrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import { useOptionalUbtAuth } from '../contexts/UbtAuthContext'
import {
  fetchPrefeituraRelatorioCategories,
  isPrefeituraRelatoriosApiError,
} from '../lib/mockServices/prefeitura/relatorios'
import {
  fetchUbtRelatorioCategories,
  isUbtRelatoriosApiError,
} from '../lib/mockServices/ubt/relatorios'
import type { RelatorioCategoryApi, RelatoriosPortal } from '../types/relatorios'

export function useRelatoriosHub(portal: RelatoriosPortal) {
  const ubtAuth = useOptionalUbtAuth()
  const prefeituraAuth = useOptionalPrefeituraAuth()

  const auth = portal === 'ubt' ? ubtAuth : prefeituraAuth
  const isBootstrapping = auth?.isBootstrapping ?? true
  const isAuthenticated = auth?.isAuthenticated ?? false

  const getAccessToken = useCallback(() => auth?.getAccessToken() ?? null, [auth])

  const [categories, setCategories] = useState<RelatorioCategoryApi[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (isBootstrapping) return

    if (!isAuthenticated) {
      setCategories([])
      setIsLoading(false)
      return
    }

    const token = getAccessToken()
    if (!token) {
      setCategories([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)

    void (async () => {
      try {
        const loaded =
          portal === 'ubt'
            ? await fetchUbtRelatorioCategories(token)
            : await fetchPrefeituraRelatorioCategories(token)
        setCategories(loaded)
      } catch (error) {
        if (portal === 'ubt' && isUbtRelatoriosApiError(error)) {
          setLoadError(error.message)
        } else if (portal === 'prefeitura' && isPrefeituraRelatoriosApiError(error)) {
          setLoadError(error.message)
        } else {
          setLoadError('Não foi possível carregar as categorias de relatórios.')
        }
        setCategories([])
      } finally {
        setIsLoading(false)
      }
    })()
  }, [getAccessToken, isAuthenticated, isBootstrapping, portal])

  return {
    categories,
    isLoading: isBootstrapping || isLoading,
    loadError,
  }
}

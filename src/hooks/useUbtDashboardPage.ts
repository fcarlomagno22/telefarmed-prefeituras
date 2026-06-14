import { useCallback, useEffect, useState } from 'react'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import {
  fetchUbtTriagemDashboard,
  isUbtTriagemApiError,
} from '../lib/services/ubt/triagem'
import type { UbtDashboardOverview } from '../types/ubtDashboard'

export function useUbtDashboardPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useUbtAuth()
  const [dashboard, setDashboard] = useState<UbtDashboardOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setDashboard(null)
      setIsLoading(false)
      return
    }

    try {
      const overview = await fetchUbtTriagemDashboard(token)
      setDashboard(overview)
      setLoadError(null)
    } catch (error) {
      const message = isUbtTriagemApiError(error)
        ? error.message
        : 'Não foi possível carregar o dashboard da unidade.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setDashboard(null)
      setIsLoading(false)
      return
    }

    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  return {
    unit: dashboard?.unit ?? null,
    kpis: dashboard?.kpis ?? [],
    filaResumo: dashboard?.filaResumo ?? null,
    consultasHoje: dashboard?.consultasHoje ?? [],
    isLoading,
    loadError,
    reload,
  }
}

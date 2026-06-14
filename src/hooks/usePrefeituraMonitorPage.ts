import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import {
  fetchPrefeituraMonitorOverview,
  isPrefeituraMonitorApiError,
  type PrefeituraMonitorOverview,
} from '../lib/services/prefeitura/monitor'
import type { MonitorComparisonTab } from '../types/prefeituraMonitor'
import { useOperationalStream } from './useOperationalStream'

export function usePrefeituraMonitorPage() {
  const { getAccessToken, user, isAuthenticated, isBootstrapping } = usePrefeituraAuth()
  const [regionKey, setRegionKey] = useState('todas')
  const [timelinePeriod, setTimelinePeriod] = useState('hoje')
  const [overview, setOverview] = useState<PrefeituraMonitorOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)

    try {
      const data = await fetchPrefeituraMonitorOverview(token, { regionKey, timelinePeriod })
      setOverview(data)
    } catch (error) {
      const message = isPrefeituraMonitorApiError(error)
        ? error.message
        : 'Não foi possível carregar o monitor operacional.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken, regionKey, timelinePeriod])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const streamScope = useMemo(
    () =>
      user
        ? ({
            portal: 'prefeitura' as const,
            entidadeContratanteId: user.entidadeContratanteId,
            regionKey,
          })
        : null,
    [user, regionKey],
  )

  useOperationalStream({
    scope: streamScope,
    enabled: isAuthenticated && !isBootstrapping,
    getAccessToken,
    onEvent: (event) => {
      if (event.entidadeContratanteId !== user?.entidadeContratanteId) return
      void reload()
    },
    onFallbackPoll: () => void reload(),
    fallbackPollMs: 60_000,
  })

  const getPreviewRankingForTab = useCallback(
    (tab: MonitorComparisonTab) => overview?.rankingByTab[tab] ?? [],
    [overview],
  )

  return {
    regionKey,
    setRegionKey,
    timelinePeriod,
    setTimelinePeriod,
    overview,
    isLoading,
    loadError,
    reload,
    getPreviewRankingForTab,
    filterOptions: overview?.filterOptions ?? {
      region: [{ value: 'todas', label: 'Todas as regiões' }],
      timelinePeriod: [
        { value: 'hoje', label: 'Hoje' },
        { value: 'ontem', label: 'Ontem' },
        { value: 'semana', label: 'Esta semana' },
      ],
    },
  }
}

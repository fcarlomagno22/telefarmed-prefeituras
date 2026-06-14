import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import {
  fetchAdminMonitorOverview,
  isAdminMonitorApiError,
  type AdminMonitorPageData,
  type AdminMonitorQueryParams,
} from '../lib/services/admin/monitor'
import { useOperationalStream } from './useOperationalStream'

export function useAdminMonitorPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()
  const [filters, setFilters] = useState<AdminMonitorQueryParams>({
    entidadeId: 'all',
    regionKey: 'todos',
    timelinePeriod: 'dia',
  })
  const [monitor, setMonitor] = useState<AdminMonitorPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)

  const reload = useCallback(async (options?: { background?: boolean }) => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    const background = options?.background === true && hasLoadedRef.current
    if (!background) {
      setIsLoading(true)
    }
    setLoadError(null)

    try {
      const data = await fetchAdminMonitorOverview(token, filters)
      setMonitor(data)
      hasLoadedRef.current = true
    } catch (error) {
      const message = isAdminMonitorApiError(error)
        ? error.message
        : 'Não foi possível carregar o monitor operacional.'
      setLoadError(message)
    } finally {
      if (!background) {
        setIsLoading(false)
      }
    }
  }, [filters, getAccessToken])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const streamScope = useMemo(
    () => ({
      portal: 'admin' as const,
      entidadeFilterId: filters.entidadeId,
      regionKey: filters.regionKey,
    }),
    [filters.entidadeId, filters.regionKey],
  )

  useOperationalStream({
    scope: streamScope,
    enabled: isAuthenticated && !isBootstrapping,
    getAccessToken,
    onEvent: () => void reload({ background: true }),
    onFallbackPoll: () => void reload({ background: true }),
  })

  const setEntidadeId = useCallback((entidadeId: string) => {
    setFilters((current) => ({ ...current, entidadeId }))
  }, [])

  const setRegionKey = useCallback((regionKey: string) => {
    setFilters((current) => ({ ...current, regionKey }))
  }, [])

  const setTimelinePeriod = useCallback((timelinePeriod: string) => {
    setFilters((current) => ({ ...current, timelinePeriod }))
  }, [])

  return {
    monitor,
    filters,
    isLoading,
    loadError,
    reload,
    setEntidadeId,
    setRegionKey,
    setTimelinePeriod,
  }
}

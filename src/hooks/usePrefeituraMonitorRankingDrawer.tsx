import { useCallback, useEffect, useRef, useState } from 'react'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import {
  fetchPrefeituraMonitorRanking,
  isPrefeituraMonitorApiError,
} from '../lib/services/prefeitura/monitor'
import { PrefeituraMonitorRankingDrawer } from '../components/prefeitura/monitor/PrefeituraMonitorRankingDrawer'
import type { MonitorComparisonRow, MonitorComparisonTab } from '../types/prefeituraMonitor'

export type PrefeituraMonitorRankingDrawerPayload = {
  initialTab?: MonitorComparisonTab
}

type UsePrefeituraMonitorRankingDrawerOptions = {
  getPreviewRankingForTab: (tab: MonitorComparisonTab) => MonitorComparisonRow[]
  regionKey: string
  timelinePeriod: string
}

export function usePrefeituraMonitorRankingDrawer(options: UsePrefeituraMonitorRankingDrawerOptions) {
  const { getPreviewRankingForTab, regionKey, timelinePeriod } = options
  const { getAccessToken } = usePrefeituraAuth()
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [initialTab, setInitialTab] = useState<MonitorComparisonTab>('produtividade')
  const [activeTab, setActiveTab] = useState<MonitorComparisonTab>('produtividade')
  const [rankingByTab, setRankingByTab] = useState<
    Partial<Record<MonitorComparisonTab, MonitorComparisonRow[]>>
  >({})
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const loadRanking = useCallback(
    async (tab: MonitorComparisonTab) => {
      const token = getAccessToken()
      if (!token) return

      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId
      setIsLoading(true)
      setLoadError(null)

      try {
        const rows = await fetchPrefeituraMonitorRanking(token, {
          tab,
          regionKey,
          timelinePeriod,
        })
        if (requestIdRef.current !== requestId) return
        setRankingByTab((current) => ({ ...current, [tab]: rows }))
      } catch (error) {
        if (requestIdRef.current !== requestId) return
        setLoadError(
          isPrefeituraMonitorApiError(error)
            ? error.message
            : 'Não foi possível carregar o ranking completo.',
        )
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false)
        }
      }
    },
    [getAccessToken, regionKey, timelinePeriod],
  )

  useEffect(() => {
    setRankingByTab({})
    setLoadError(null)
  }, [regionKey, timelinePeriod])

  useEffect(() => {
    if (!open) return
    void loadRanking(activeTab)
  }, [open, activeTab, loadRanking])

  const openDrawer = useCallback((payload?: PrefeituraMonitorRankingDrawerPayload) => {
    const tab = payload?.initialTab ?? 'produtividade'
    setInitialTab(tab)
    setActiveTab(tab)
    setClosing(false)
    setOpen(true)
  }, [])

  const requestClose = useCallback(() => {
    setClosing(true)
  }, [])

  const handleTransitionEnd = useCallback(() => {
    if (closing) {
      setOpen(false)
      setClosing(false)
    }
  }, [closing])

  const handleTabChange = useCallback((tab: MonitorComparisonTab) => {
    setActiveTab(tab)
  }, [])

  const getRankingForTab = useCallback(
    (tab: MonitorComparisonTab) => rankingByTab[tab] ?? getPreviewRankingForTab(tab),
    [getPreviewRankingForTab, rankingByTab],
  )

  const drawerElement = (
    <PrefeituraMonitorRankingDrawer
      open={open}
      closing={closing}
      initialTab={initialTab}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      getRankingForTab={getRankingForTab}
      isLoading={isLoading}
      loadError={loadError}
      onClose={requestClose}
      onTransitionEnd={handleTransitionEnd}
    />
  )

  return {
    openDrawer,
    drawerElement,
  }
}

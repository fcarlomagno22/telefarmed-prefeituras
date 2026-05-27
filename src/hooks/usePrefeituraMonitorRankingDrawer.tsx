import { useCallback, useState } from 'react'
import { PrefeituraMonitorRankingDrawer } from '../components/prefeitura/monitor/PrefeituraMonitorRankingDrawer'
import type { MonitorComparisonTab } from '../data/prefeituraMonitorMock'

export type PrefeituraMonitorRankingDrawerPayload = {
  initialTab?: MonitorComparisonTab
}

export function usePrefeituraMonitorRankingDrawer() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [initialTab, setInitialTab] = useState<MonitorComparisonTab>('produtividade')

  const openDrawer = useCallback((payload?: PrefeituraMonitorRankingDrawerPayload) => {
    setInitialTab(payload?.initialTab ?? 'produtividade')
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

  const drawerElement = (
    <PrefeituraMonitorRankingDrawer
      open={open}
      closing={closing}
      initialTab={initialTab}
      onClose={requestClose}
      onTransitionEnd={handleTransitionEnd}
    />
  )

  return {
    openDrawer,
    drawerElement,
  }
}

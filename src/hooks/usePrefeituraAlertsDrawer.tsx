import { useCallback, useState } from 'react'
import { PrefeituraAlertsDrawer } from '../components/prefeitura/PrefeituraAlertsDrawer'
import type { PrefeituraAlert } from '../types/prefeituraDashboard'

export function usePrefeituraAlertsDrawer() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [alerts, setAlerts] = useState<PrefeituraAlert[]>([])

  const openDrawer = useCallback((nextAlerts: PrefeituraAlert[]) => {
    setAlerts(nextAlerts)
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
    <PrefeituraAlertsDrawer
      open={open}
      closing={closing}
      alerts={alerts}
      onClose={requestClose}
      onTransitionEnd={handleTransitionEnd}
    />
  )

  return {
    openDrawer,
    drawerElement,
  }
}

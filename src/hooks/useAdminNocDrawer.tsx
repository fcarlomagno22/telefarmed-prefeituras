import { useCallback, useState } from 'react'
import { AdminNocDrawer } from '../components/admin/dashboard/AdminNocDrawer'
import type { AdminNocIncident } from '../data/adminDashboardMock'

export function useAdminNocDrawer() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [incidents, setIncidents] = useState<AdminNocIncident[]>([])

  const openDrawer = useCallback((next: AdminNocIncident[]) => {
    setIncidents(next)
    setClosing(false)
    setOpen(true)
  }, [])

  const requestClose = useCallback(() => setClosing(true), [])

  const handleTransitionEnd = useCallback(() => {
    if (closing) {
      setOpen(false)
      setClosing(false)
    }
  }, [closing])

  return {
    openDrawer,
    drawerElement: (
      <AdminNocDrawer
        open={open}
        closing={closing}
        incidents={incidents}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
      />
    ),
  }
}

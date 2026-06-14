import { useCallback, useState } from 'react'
import { AdminNocDrawer } from '../components/admin/dashboard/AdminNocDrawer'
import type { AdminDashboardNocPatchParams } from '../lib/api/admin/dashboard'
import { updateAdminDashboardNocIncident } from '../lib/services/admin/dashboard'
import type { AdminNocIncident } from '../types/adminDashboard'
import { useAdminAuth } from '../contexts/AdminAuthContext'

export function useAdminNocDrawer() {
  const { getAccessToken } = useAdminAuth()
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

  const handleIncidentPatch = useCallback(
    async (incidentId: string, patch: AdminDashboardNocPatchParams) => {
      const token = getAccessToken()
      if (!token) return

      const updated = await updateAdminDashboardNocIncident(token, incidentId, patch)
      if (!updated) {
        setIncidents((current) =>
          current.map((item) => {
            if (item.id !== incidentId) return item
            return {
              ...item,
              ...(patch.team !== undefined ? { team: patch.team } : {}),
              ...(patch.assignee !== undefined ? { assignee: patch.assignee } : {}),
              ...(patch.status !== undefined ? { status: patch.status } : {}),
            }
          }),
        )
        return
      }

      setIncidents((current) =>
        current.map((item) => (item.id === incidentId ? updated : item)),
      )
    },
    [getAccessToken],
  )

  return {
    openDrawer,
    drawerElement: (
      <AdminNocDrawer
        open={open}
        closing={closing}
        incidents={incidents}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onIncidentPatch={handleIncidentPatch}
      />
    ),
  }
}

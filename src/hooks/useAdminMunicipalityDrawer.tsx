import { useCallback, useState } from 'react'
import { AdminMunicipalityDrawer } from '../components/admin/dashboard/AdminMunicipalityDrawer'
import type { AdminMunicipalityRow } from '../data/adminDashboardMock'

export function useAdminMunicipalityDrawer() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [row, setRow] = useState<AdminMunicipalityRow | null>(null)

  const openDrawer = useCallback((next: AdminMunicipalityRow) => {
    setRow(next)
    setClosing(false)
    setOpen(true)
  }, [])

  const requestClose = useCallback(() => setClosing(true), [])

  const handleTransitionEnd = useCallback(() => {
    if (closing) {
      setOpen(false)
      setClosing(false)
      setRow(null)
    }
  }, [closing])

  return {
    openDrawer,
    drawerElement: (
      <AdminMunicipalityDrawer
        open={open}
        closing={closing}
        row={row}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
      />
    ),
  }
}

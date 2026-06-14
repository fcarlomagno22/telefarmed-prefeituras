import { useCallback, useState } from 'react'
import {
  AdminKpiDrillDrawer,
  type AdminKpiDrillRow,
} from '../components/admin/dashboard/AdminKpiDrillDrawer'
import type { AdminKpiDrillKind } from '../types/adminDashboard'

export function useAdminKpiDrillDrawer() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [kind, setKind] = useState<AdminKpiDrillKind | null>(null)
  const [rows, setRows] = useState<AdminKpiDrillRow[]>([])

  const openDrawer = useCallback((nextKind: AdminKpiDrillKind, nextRows: AdminKpiDrillRow[]) => {
    setKind(nextKind)
    setRows(nextRows)
    setClosing(false)
    setOpen(true)
  }, [])

  const requestClose = useCallback(() => setClosing(true), [])

  const handleTransitionEnd = useCallback(() => {
    if (closing) {
      setOpen(false)
      setClosing(false)
      setKind(null)
      setRows([])
    }
  }, [closing])

  return {
    openDrawer,
    drawerElement: (
      <AdminKpiDrillDrawer
        open={open}
        closing={closing}
        kind={kind}
        rows={rows}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
      />
    ),
  }
}

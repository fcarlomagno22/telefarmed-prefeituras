import { useCallback, useState } from 'react'
import { PrefeituraSlaDrawer } from '../components/prefeitura/PrefeituraSlaDrawer'
import type { PrefeituraUbsRow } from '../types/prefeituraDashboard'

export type PrefeituraSlaDrawerPayload = {
  ubsRows: PrefeituraUbsRow[]
}

export function usePrefeituraSlaDrawer() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [ubsRows, setUbsRows] = useState<PrefeituraUbsRow[]>([])

  const openDrawer = useCallback((next: PrefeituraSlaDrawerPayload) => {
    setUbsRows(next.ubsRows)
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
    <PrefeituraSlaDrawer
      open={open}
      closing={closing}
      ubsRows={ubsRows}
      onClose={requestClose}
      onTransitionEnd={handleTransitionEnd}
    />
  )

  return {
    openDrawer,
    drawerElement,
  }
}

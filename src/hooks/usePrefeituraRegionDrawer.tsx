import { useCallback, useState } from 'react'
import { PrefeituraRegionDrawer } from '../components/prefeitura/PrefeituraRegionDrawer'
import type { PrefeituraUbsRow } from '../types/prefeituraDashboard'
import type { PrefeituraRegionVolume } from '../utils/prefeituraDashboardFilters'

export type PrefeituraRegionDrawerPayload = {
  regions: PrefeituraRegionVolume[]
  ubsRows: PrefeituraUbsRow[]
}

export function usePrefeituraRegionDrawer() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [payload, setPayload] = useState<PrefeituraRegionDrawerPayload>({
    regions: [],
    ubsRows: [],
  })

  const openDrawer = useCallback((next: PrefeituraRegionDrawerPayload) => {
    setPayload(next)
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
    <PrefeituraRegionDrawer
      open={open}
      closing={closing}
      regions={payload.regions}
      ubsRows={payload.ubsRows}
      onClose={requestClose}
      onTransitionEnd={handleTransitionEnd}
    />
  )

  return {
    openDrawer,
    drawerElement,
  }
}

import { useCallback, useState } from 'react'
import { PrefeituraSpecialtyDrawer } from '../components/prefeitura/PrefeituraSpecialtyDrawer'
import type { PrefeituraSpecialtyStat } from '../data/prefeituraSpecialtyStats'

export type PrefeituraSpecialtyDrawerPayload = {
  specialties: PrefeituraSpecialtyStat[]
  total: number
}

export function usePrefeituraSpecialtyDrawer() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [payload, setPayload] = useState<PrefeituraSpecialtyDrawerPayload>({
    specialties: [],
    total: 0,
  })

  const openDrawer = useCallback((next: PrefeituraSpecialtyDrawerPayload) => {
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
    <PrefeituraSpecialtyDrawer
      open={open}
      closing={closing}
      specialties={payload.specialties}
      total={payload.total}
      onClose={requestClose}
      onTransitionEnd={handleTransitionEnd}
    />
  )

  return {
    openDrawer,
    drawerElement,
  }
}

import { useCallback, useState } from 'react'
import { PrefeituraRedeQuickActionDrawer } from '../components/prefeitura/rede/PrefeituraRedeQuickActionDrawer'
import type { PrefeituraRedeQuickActionId } from '../data/prefeituraRedeMock'

export function usePrefeituraRedeQuickActionDrawer() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [actionId, setActionId] = useState<PrefeituraRedeQuickActionId | null>(null)

  const openDrawer = useCallback(() => {
    setActionId(null)
    setClosing(false)
    setOpen(true)
  }, [])

  const selectAction = useCallback((id: PrefeituraRedeQuickActionId) => {
    setActionId(id)
  }, [])

  const backToHub = useCallback(() => {
    setActionId(null)
  }, [])

  const requestClose = useCallback(() => {
    setClosing(true)
  }, [])

  const handleTransitionEnd = useCallback(() => {
    if (closing) {
      setOpen(false)
      setClosing(false)
      setActionId(null)
    }
  }, [closing])

  const drawerElement = (
    <PrefeituraRedeQuickActionDrawer
      actionId={actionId}
      open={open}
      closing={closing}
      onClose={requestClose}
      onSelectAction={selectAction}
      onBackToHub={backToHub}
      onTransitionEnd={handleTransitionEnd}
    />
  )

  return {
    openDrawer,
    drawerElement,
  }
}

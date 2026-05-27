import { useCallback, useState } from 'react'
import { AccessLogsDrawer } from '../components/credenciais/AccessLogsDrawer'

export function useAccessLogsDrawer() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  const openDrawer = useCallback(() => {
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
    <AccessLogsDrawer
      open={open}
      closing={closing}
      onClose={requestClose}
      onTransitionEnd={handleTransitionEnd}
    />
  )

  return {
    openDrawer,
    drawerElement,
  }
}

import { useCallback, useState } from 'react'
import { NewSupportTicketDrawer } from '../components/suporte/NewSupportTicketDrawer'
import { Toast } from '../components/ui/Toast'

export function useNewSupportTicketDrawer() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [toast, setToast] = useState<{ message: string } | null>(null)

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

  const handleSubmitted = useCallback(() => {
    setClosing(true)
    setToast({ message: 'Chamado aberto com sucesso!' })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const drawerElement = (
    <>
      <NewSupportTicketDrawer
        open={open}
        closing={closing}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onSubmitted={handleSubmitted}
      />
      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant="success"
        onClose={dismissToast}
      />
    </>
  )

  return {
    openDrawer,
    drawerElement,
  }
}

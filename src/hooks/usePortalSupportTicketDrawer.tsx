import { useCallback, useState } from 'react'
import { NewSupportTicketDrawer, type NewSupportTicketPayload } from '../components/suporte/NewSupportTicketDrawer'
import { isPortalSuporteApiError } from '../lib/services/portal/suporte'
import type { CreatePortalSupportTicketInput } from '../lib/services/portal/suporte'

type UsePortalSupportTicketDrawerOptions = {
  tourLockClose?: boolean
  onCreateTicket: (input: CreatePortalSupportTicketInput) => Promise<unknown>
}

export function usePortalSupportTicketDrawer({
  tourLockClose = false,
  onCreateTicket,
}: UsePortalSupportTicketDrawerOptions) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const openDrawer = useCallback(() => {
    setSubmitError(null)
    setClosing(false)
    setOpen(true)
  }, [])

  const requestClose = useCallback(() => {
    if (isSubmitting) return
    setClosing(true)
  }, [isSubmitting])

  const handleTransitionEnd = useCallback(() => {
    if (closing) {
      setOpen(false)
      setClosing(false)
    }
  }, [closing])

  const handleSubmit = useCallback(
    async (payload: NewSupportTicketPayload) => {
      setIsSubmitting(true)
      setSubmitError(null)
      try {
        await onCreateTicket({
          subject: payload.subject,
          category: payload.category,
          priority: payload.priority,
          body: payload.body,
          files: payload.files,
        })
        setClosing(true)
      } catch (error) {
        const message = isPortalSuporteApiError(error)
          ? error.message
          : 'Não foi possível abrir o chamado.'
        setSubmitError(message)
      } finally {
        setIsSubmitting(false)
      }
    },
    [onCreateTicket],
  )

  const drawerElement = (
    <NewSupportTicketDrawer
      open={open}
      closing={closing}
      onClose={requestClose}
      onTransitionEnd={handleTransitionEnd}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitError={submitError}
      tourLockClose={tourLockClose}
    />
  )

  return {
    openDrawer,
    requestClose,
    drawerElement,
  }
}

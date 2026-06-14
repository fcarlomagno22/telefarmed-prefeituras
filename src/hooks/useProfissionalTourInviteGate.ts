import { useCallback, useEffect, useState } from 'react'

type UseProfissionalTourInviteGateOptions = {
  disabled?: boolean
  isInvitePending: () => boolean
  markInviteHandled: () => void
  onStartTour: () => void
}

export function useProfissionalTourInviteGate({
  disabled = false,
  isInvitePending,
  markInviteHandled,
  onStartTour,
}: UseProfissionalTourInviteGateOptions) {
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => {
    if (disabled) return
    if (isInvitePending()) {
      const timer = window.setTimeout(() => setInviteOpen(true), 600)
      return () => window.clearTimeout(timer)
    }
  }, [disabled, isInvitePending])

  const acceptInvite = useCallback(() => {
    markInviteHandled()
    setInviteOpen(false)
    onStartTour()
  }, [markInviteHandled, onStartTour])

  const dismissInvite = useCallback(() => {
    markInviteHandled()
    setInviteOpen(false)
  }, [markInviteHandled])

  return {
    inviteOpen,
    acceptInvite,
    dismissInvite,
  }
}

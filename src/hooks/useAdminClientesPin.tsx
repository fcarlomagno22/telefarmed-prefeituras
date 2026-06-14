import { useCallback, useRef, useState } from 'react'
import {
  CredentialActionPinModal,
  type CredentialPinAction,
} from '../components/credenciais/CredentialActionPinModal'
import { AdminAuthApiError, verifyAdminAuthorizationPin } from '../lib/services/admin/auth'
import { useAdminAuth } from '../contexts/AdminAuthContext'

export type ClientePinAction = Extract<
  CredentialPinAction,
  | 'save_entidade_create'
  | 'save_entidade_edit'
  | 'save_entidade_contacts'
  | 'save_entidade_status'
  | 'save_contrato_create'
  | 'save_contrato_edit'
  | 'contrato_suspender'
  | 'contrato_reativar'
  | 'contrato_encerrar'
  | 'delete_entidade'
  | 'delete_contrato'
>

type PendingPin = {
  action: ClientePinAction
  label: string
  onConfirmed: (pin: string) => Promise<void>
}

export function useAdminClientesPin() {
  const { getAccessToken } = useAdminAuth()
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const verifiedPinRef = useRef('')

  const requestPin = useCallback((pending: PendingPin) => {
    verifiedPinRef.current = ''
    setPendingPin(pending)
  }, [])

  const closePin = useCallback(() => {
    if (isSubmitting) return
    setPendingPin(null)
  }, [isSubmitting])

  const verifyPin = useCallback(
    async (pin: string) => {
      const token = getAccessToken()
      if (!token) return false

      try {
        await verifyAdminAuthorizationPin(token, pin)
        verifiedPinRef.current = pin
        return true
      } catch (error) {
        if (error instanceof AdminAuthApiError && error.code === 'PIN_NOT_CONFIGURED') {
          setPendingPin(null)
        }
        return false
      }
    },
    [getAccessToken],
  )

  const handlePinSuccess = useCallback(async () => {
    if (!pendingPin) return
    const pin = verifiedPinRef.current
    if (!pin) return

    setIsSubmitting(true)
    try {
      await pendingPin.onConfirmed(pin)
      setPendingPin(null)
    } finally {
      setIsSubmitting(false)
      verifiedPinRef.current = ''
    }
  }, [pendingPin])

  const pinModal = (
    <CredentialActionPinModal
      open={pendingPin !== null}
      action={pendingPin?.action ?? null}
      userName={pendingPin?.label ?? ''}
      pinAudience="admin"
      onClose={closePin}
      onSuccess={() => void handlePinSuccess()}
      verifyPin={verifyPin}
    />
  )

  return {
    requestPin,
    closePin,
    pinModal,
    isSubmitting,
  }
}

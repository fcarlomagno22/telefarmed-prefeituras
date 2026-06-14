import { useCallback, useRef, useState } from 'react'
import {
  CredentialActionPinModal,
  type CredentialPinAction,
} from '../components/credenciais/CredentialActionPinModal'
import { PrefeituraEditUbtDrawer } from '../components/prefeitura/rede/PrefeituraEditUbtDrawer'
import { PrefeituraRedeUnitNotifyDrawer } from '../components/prefeitura/rede/PrefeituraRedeUnitNotifyDrawer'
import type { PrefeituraRedeUnitAction } from '../components/prefeitura/rede/PrefeituraRedeUnitActionsMenu'
import { Toast, type ToastVariant } from '../components/ui/Toast'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import type { PrefeituraRedeUnit } from '../data/prefeituraRedeMock'
import {
  PrefeituraAuthApiError,
  verifyPrefeituraAuthorizationPin,
} from '../lib/services/prefeitura/auth'
import {
  deletePrefeituraRedeUnit,
  isPrefeituraRedeApiError,
  updatePrefeituraRedeUnit,
} from '../lib/services/prefeitura/rede'
import type { usePrefeituraUbsDetailDrawer } from './usePrefeituraUbsDetailDrawer'

type RedeUnitPinAction = Extract<
  CredentialPinAction,
  'ubt_suspend' | 'ubt_delete' | 'ubt_maintenance' | 'ubt_reactivate'
>

type PendingPin = {
  action: RedeUnitPinAction
  unit: PrefeituraRedeUnit
}

type UsePrefeituraRedeUnitActionsOptions = {
  onReload: () => void
  ubsDetailDrawer: Pick<ReturnType<typeof usePrefeituraUbsDetailDrawer>, 'openDrawerFromRedeUnit'>
}

export function usePrefeituraRedeUnitActions({
  onReload,
  ubsDetailDrawer,
}: UsePrefeituraRedeUnitActionsOptions) {
  const { getAccessToken } = usePrefeituraAuth()
  const [openMenuUnitId, setOpenMenuUnitId] = useState<string | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<PrefeituraRedeUnit | null>(null)
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editClosing, setEditClosing] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifyClosing, setNotifyClosing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)
  const verifiedPinRef = useRef('')

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const closeMenu = useCallback(() => setOpenMenuUnitId(null), [])

  const toggleMenu = useCallback((unitId: string) => {
    setOpenMenuUnitId((current) => (current === unitId ? null : unitId))
  }, [])

  const closePin = useCallback(() => {
    if (isSubmitting) return
    setPendingPin(null)
    verifiedPinRef.current = ''
  }, [isSubmitting])

  const verifyPin = useCallback(
    async (pin: string) => {
      const token = getAccessToken()
      if (!token) return false

      try {
        await verifyPrefeituraAuthorizationPin(token, pin)
        verifiedPinRef.current = pin
        return true
      } catch (error) {
        if (error instanceof PrefeituraAuthApiError && error.code === 'PIN_NOT_CONFIGURED') {
          showToast(error.message, 'error')
          setPendingPin(null)
        }
        return false
      }
    },
    [getAccessToken, showToast],
  )

  const handleUnitAction = useCallback(
    (unit: PrefeituraRedeUnit, action: PrefeituraRedeUnitAction) => {
      setSelectedUnit(unit)

      switch (action) {
        case 'view':
          ubsDetailDrawer.openDrawerFromRedeUnit(unit)
          return
        case 'edit':
          setEditClosing(false)
          setEditOpen(true)
          return
        case 'notify':
          setNotifyClosing(false)
          setNotifyOpen(true)
          return
        case 'delete':
          verifiedPinRef.current = ''
          setPendingPin({ action: 'ubt_delete', unit })
          return
        case 'maintenance':
          verifiedPinRef.current = ''
          setPendingPin({ action: 'ubt_maintenance', unit })
          return
        case 'suspend':
          verifiedPinRef.current = ''
          setPendingPin({ action: 'ubt_suspend', unit })
          return
        case 'reactivate':
          verifiedPinRef.current = ''
          setPendingPin({ action: 'ubt_reactivate', unit })
          return
        default:
          return
      }
    },
    [ubsDetailDrawer],
  )

  const handlePinSuccess = useCallback(async () => {
    if (!pendingPin) return

    const token = getAccessToken()
    if (!token) return

    setIsSubmitting(true)
    try {
      if (pendingPin.action === 'ubt_suspend') {
        await updatePrefeituraRedeUnit(token, pendingPin.unit.id, { status: 'inativa' })
        onReload()
        showToast(`${pendingPin.unit.name} suspensa.`)
      } else if (pendingPin.action === 'ubt_maintenance') {
        await updatePrefeituraRedeUnit(token, pendingPin.unit.id, { status: 'manutencao' })
        onReload()
        showToast(`${pendingPin.unit.name} em manutenção.`)
      } else if (pendingPin.action === 'ubt_reactivate') {
        await updatePrefeituraRedeUnit(token, pendingPin.unit.id, { status: 'ativa' })
        onReload()
        showToast(`${pendingPin.unit.name} reativada.`)
      } else {
        await deletePrefeituraRedeUnit(token, pendingPin.unit.id)
        onReload()
        showToast('UBT excluída da rede.')
      }
      setPendingPin(null)
    } catch (error) {
      showToast(
        isPrefeituraRedeApiError(error) ? error.message : 'Não foi possível concluir a operação.',
        'error',
      )
    } finally {
      setIsSubmitting(false)
      verifiedPinRef.current = ''
    }
  }, [getAccessToken, onReload, pendingPin, showToast])

  const overlays = (
    <>
      <PrefeituraEditUbtDrawer
        unit={selectedUnit}
        open={editOpen}
        closing={editClosing}
        onClose={() => setEditClosing(true)}
        onTransitionEnd={() => {
          if (editClosing) {
            setEditOpen(false)
            setEditClosing(false)
          }
        }}
        onSaved={(unitName) => {
          onReload()
          showToast(`${unitName} atualizada com sucesso.`)
        }}
      />

      <PrefeituraRedeUnitNotifyDrawer
        unit={selectedUnit}
        open={notifyOpen}
        closing={notifyClosing}
        onClose={() => setNotifyClosing(true)}
        onTransitionEnd={() => {
          if (notifyClosing) {
            setNotifyOpen(false)
            setNotifyClosing(false)
          }
        }}
        onSuccess={(message) => showToast(message)}
      />

      <CredentialActionPinModal
        open={pendingPin !== null}
        action={pendingPin?.action ?? null}
        userName={pendingPin?.unit.name ?? ''}
        pinAudience="admin"
        onClose={closePin}
        onSuccess={() => void handlePinSuccess()}
        verifyPin={verifyPin}
      />

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant}
        onClose={dismissToast}
      />
    </>
  )

  return {
    openMenuUnitId,
    toggleMenu,
    closeMenu,
    handleUnitAction,
    overlays,
  }
}

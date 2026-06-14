import { useCallback, useState } from 'react'
import { PrefeituraNewUbtDrawer } from '../components/prefeitura/rede/PrefeituraNewUbtDrawer'
import { Toast } from '../components/ui/Toast'

const NEW_UBT_SUCCESS_TOAST_MS = 6000

type UsePrefeituraNewUbtDrawerOptions = {
  onRegistered?: () => void
}

export function usePrefeituraNewUbtDrawer(options: UsePrefeituraNewUbtDrawerOptions = {}) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

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

  const dismissSuccessToast = useCallback(() => setSuccessToast(null), [])

  const handleRegistered = useCallback(
    (unitName: string) => {
      options.onRegistered?.()
      setSuccessToast(
        `${unitName} cadastrada na rede. Acesse Credenciais de acesso para criar a credencial da gestora responsável.`,
      )
    },
    [options.onRegistered],
  )

  const drawerElement = (
    <>
      <PrefeituraNewUbtDrawer
        open={open}
        closing={closing}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onRegistered={handleRegistered}
      />
      <Toast
        message={successToast ?? ''}
        visible={successToast !== null}
        onClose={dismissSuccessToast}
        durationMs={NEW_UBT_SUCCESS_TOAST_MS}
      />
    </>
  )

  return {
    openDrawer,
    drawerElement,
  }
}

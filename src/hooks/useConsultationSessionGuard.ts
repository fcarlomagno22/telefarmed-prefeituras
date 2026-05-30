import { useCallback, useEffect, useState, type RefObject } from 'react'

export const CONSULTATION_LOCK_STORAGE_KEY = 'telefarmed:consultation-lock'

export type ConsultationBlockReason = 'back' | 'reload' | 'reload-shortcut'

export type UseConsultationSessionGuardOptions = {
  /** Toast ou outro feedback em vez do modal padrão. */
  onBlocked?: (reason: ConsultationBlockReason) => void
  /** Quando true, libera navegação (ex.: após finalizar consulta). */
  allowNavigationRef?: RefObject<boolean>
}

function isReloadShortcut(event: KeyboardEvent): boolean {
  if (event.key === 'F5') return true

  const key = event.key.toLowerCase()
  if (key !== 'r') return false

  return event.ctrlKey || event.metaKey
}

export function readConsultationLockFromStorage(): boolean {
  try {
    return sessionStorage.getItem(CONSULTATION_LOCK_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeConsultationLockToStorage(active: boolean) {
  try {
    if (active) {
      sessionStorage.setItem(CONSULTATION_LOCK_STORAGE_KEY, '1')
    } else {
      sessionStorage.removeItem(CONSULTATION_LOCK_STORAGE_KEY)
    }
  } catch {
    // sessionStorage indisponível (modo privado, etc.)
  }
}

export function useConsultationSessionGuard(
  active: boolean,
  options?: UseConsultationSessionGuardOptions,
) {
  const [showBlockModal, setShowBlockModal] = useState(false)
  const onBlocked = options?.onBlocked
  const allowNavigationRef = options?.allowNavigationRef

  const dismissBlockModal = useCallback(() => {
    setShowBlockModal(false)
  }, [])

  const notifyBlocked = useCallback(
    (reason: ConsultationBlockReason) => {
      if (onBlocked) {
        onBlocked(reason)
        return
      }
      setShowBlockModal(true)
    },
    [onBlocked],
  )

  useEffect(() => {
    writeConsultationLockToStorage(active)
  }, [active])

  useEffect(() => {
    if (!active) return

    const navEntry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined

    if (navEntry?.type === 'reload') {
      notifyBlocked('reload')
    }
  }, [active, notifyBlocked])

  useEffect(() => {
    if (!active) return

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (allowNavigationRef?.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [active, allowNavigationRef])

  useEffect(() => {
    if (!active) return

    function pushLockState() {
      window.history.pushState({ consultationLock: true }, '', window.location.href)
    }

    pushLockState()

    function handlePopState() {
      pushLockState()
      notifyBlocked('back')
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!isReloadShortcut(event)) return

      event.preventDefault()
      event.stopPropagation()
      notifyBlocked('reload-shortcut')
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('keydown', handleKeyDown, true)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [active, notifyBlocked])

  return { showBlockModal, dismissBlockModal }
}

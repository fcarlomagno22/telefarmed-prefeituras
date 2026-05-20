import { useCallback, useEffect, useState } from 'react'

export const CONSULTATION_LOCK_STORAGE_KEY = 'telefarmed:consultation-lock'

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

export function useConsultationSessionGuard(active: boolean) {
  const [showBlockModal, setShowBlockModal] = useState(false)

  const dismissBlockModal = useCallback(() => {
    setShowBlockModal(false)
  }, [])

  const openBlockModal = useCallback(() => {
    setShowBlockModal(true)
  }, [])

  useEffect(() => {
    writeConsultationLockToStorage(active)
  }, [active])

  useEffect(() => {
    if (!active) return

    const navEntry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined

    if (navEntry?.type === 'reload') {
      openBlockModal()
    }
  }, [active, openBlockModal])

  useEffect(() => {
    if (!active) return

    function pushLockState() {
      window.history.pushState({ consultationLock: true }, '', window.location.href)
    }

    pushLockState()

    function handlePopState() {
      pushLockState()
      openBlockModal()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!isReloadShortcut(event)) return

      event.preventDefault()
      event.stopPropagation()
      openBlockModal()
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('keydown', handleKeyDown, true)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [active, openBlockModal])

  return { showBlockModal, dismissBlockModal, openBlockModal }
}

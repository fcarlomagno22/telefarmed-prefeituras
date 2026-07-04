import { useCallback, useEffect, useRef, useState } from 'react'
import type { PwaInstallMode } from '../utils/pwaInstall.types'
import type { BeforeInstallPromptEvent } from '../utils/pwaInstall.web'
import {
  isIosWeb,
  isPwaStandalone,
  markPwaInstallDismissed,
  registerPwaServiceWorker,
  resolvePwaInstallMode,
  shouldOfferPwaInstall,
  waitForBeforeInstallPrompt,
} from '../utils/pwaInstall.web'

type UsePwaInstallResult = {
  visible: boolean
  installMode: PwaInstallMode
  isInstalling: boolean
  canNativeInstall: boolean
  dismiss: () => void
  install: () => Promise<void>
}

export function usePwaInstall(): UsePwaInstallResult {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [hasNativePrompt, setHasNativePrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  const installMode = resolvePwaInstallMode(hasNativePrompt)
  const canNativeInstall = hasNativePrompt && !isIosWeb()

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (isPwaStandalone()) {
      setVisible(false)
      return
    }

    registerPwaServiceWorker()

    function openPrompt() {
      if (shouldOfferPwaInstall(true)) {
        setVisible(true)
      }
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      deferredPromptRef.current = event as BeforeInstallPromptEvent
      setHasNativePrompt(true)
      openPrompt()
    }

    const handleAppInstalled = () => {
      deferredPromptRef.current = null
      setHasNativePrompt(false)
      setVisible(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    let timer: number | undefined

    if (shouldOfferPwaInstall(false)) {
      timer = window.setTimeout(() => setVisible(true), 700)
    }

    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const dismiss = useCallback(() => {
    markPwaInstallDismissed()
    setVisible(false)
  }, [])

  const install = useCallback(async () => {
    if (isIosWeb()) {
      dismiss()
      return
    }

    setIsInstalling(true)

    let promptEvent = deferredPromptRef.current
    if (!promptEvent) {
      promptEvent = await waitForBeforeInstallPrompt(2500)
      if (promptEvent) {
        deferredPromptRef.current = promptEvent
        setHasNativePrompt(true)
      }
    }

    if (!promptEvent) {
      setIsInstalling(false)
      return
    }

    try {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice

      if (choice.outcome === 'accepted') {
        setVisible(false)
      } else {
        markPwaInstallDismissed()
        setVisible(false)
      }
    } catch {
      markPwaInstallDismissed()
      setVisible(false)
    } finally {
      deferredPromptRef.current = null
      setHasNativePrompt(false)
      setIsInstalling(false)
    }
  }, [dismiss])

  return {
    visible,
    installMode,
    isInstalling,
    canNativeInstall,
    dismiss,
    install,
  }
}

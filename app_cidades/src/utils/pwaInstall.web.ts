import type { PwaInstallMode } from './pwaInstall.types'

const DISMISS_STORAGE_KEY = 'telefarmed.pwa_install.dismissed_at'
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type { PwaInstallMode } from './pwaInstall.types'

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isMobileWebBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function isIosWeb(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function isAndroidWebBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

export function wasPwaInstallDismissedRecently(): boolean {
  if (typeof localStorage === 'undefined') return false

  const raw = localStorage.getItem(DISMISS_STORAGE_KEY)
  if (!raw) return false

  const dismissedAt = Number.parseInt(raw, 10)
  if (!Number.isFinite(dismissedAt)) return false

  return Date.now() - dismissedAt < DISMISS_TTL_MS
}

export function markPwaInstallDismissed(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()))
}

export function registerPwaServiceWorker(): void {
  if (__DEV__) return
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

  void navigator.serviceWorker.register('/sw.js').catch(() => {
    // Sem SW — install nativo pode não estar disponível.
  })
}

export function resolvePwaInstallMode(hasNativePrompt: boolean): PwaInstallMode {
  if (isIosWeb()) return 'manual-ios'
  if (hasNativePrompt || isAndroidWebBrowser()) return 'native'
  return 'native'
}

export function shouldOfferPwaInstall(_hasNativePrompt: boolean): boolean {
  if (typeof window === 'undefined') return false
  if (isPwaStandalone()) return false
  if (!__DEV__ && wasPwaInstallDismissedRecently()) return false
  return isMobileWebBrowser()
}

export function waitForBeforeInstallPrompt(
  timeoutMs: number,
): Promise<BeforeInstallPromptEvent | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)

  return new Promise((resolve) => {
    let settled = false

    const finish = (event: BeforeInstallPromptEvent | null) => {
      if (settled) return
      settled = true
      window.removeEventListener('beforeinstallprompt', handleEvent)
      window.clearTimeout(timer)
      resolve(event)
    }

    const handleEvent = (event: Event) => {
      event.preventDefault()
      finish(event as BeforeInstallPromptEvent)
    }

    const timer = window.setTimeout(() => finish(null), timeoutMs)
    window.addEventListener('beforeinstallprompt', handleEvent)
  })
}

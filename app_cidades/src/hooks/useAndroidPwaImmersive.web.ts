import { useEffect } from 'react'
import {
  WEB_CHROME_COLOR,
  applyWebChromeColor,
  shouldUseAndroidWebImmersive,
} from '../adapters/webChromeTheme.web'

function exitDocumentFullscreenIfActive() {
  if (typeof document === 'undefined') return

  const doc = document as Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> }
  if (!doc.fullscreenElement && !doc.webkitFullscreenElement) return

  void (document.exitFullscreen?.() ?? doc.webkitExitFullscreen?.())?.catch(() => undefined)
}

/** Aplica theme-color / color-scheme no Android web/PWA, sem entrar em fullscreen. */
export function useAndroidPwaImmersive() {
  useEffect(() => {
    if (!shouldUseAndroidWebImmersive()) return

    exitDocumentFullscreenIfActive()
    applyWebChromeColor(WEB_CHROME_COLOR, WEB_CHROME_COLOR, { colorScheme: 'light' })
  }, [])
}

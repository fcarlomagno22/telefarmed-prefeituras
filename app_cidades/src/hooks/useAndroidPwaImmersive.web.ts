import { useEffect } from 'react'
import {
  WEB_CHROME_COLOR,
  applyWebChromeColor,
  requestAndroidPwaFullscreen,
  shouldUseAndroidWebImmersive,
} from '../adapters/webChromeTheme.web'

function isAlreadyFullscreen(): boolean {
  const doc = document as Document & { webkitFullscreenElement?: Element | null }
  return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement)
}

export function useAndroidPwaImmersive() {
  useEffect(() => {
    if (!shouldUseAndroidWebImmersive()) return

    const enter = () => {
      if (isAlreadyFullscreen()) return

      void requestAndroidPwaFullscreen()
        .then(() => applyWebChromeColor(WEB_CHROME_COLOR))
        .catch(() => {})
    }

    document.addEventListener('pointerdown', enter, { capture: true, once: true })

    const onFullscreenChange = () => {
      if (!isAlreadyFullscreen()) {
        document.addEventListener('pointerdown', enter, { capture: true, once: true })
      }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', onFullscreenChange)

    return () => {
      document.removeEventListener('pointerdown', enter, { capture: true })
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
    }
  }, [])
}

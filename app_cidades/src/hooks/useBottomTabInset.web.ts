import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isAndroidWeb } from '../adapters/webChromeTheme.web'

const DEFAULT_MIN = 8
const ANDROID_BROWSER_MIN = 12
/** Com nav bar oculta (fullscreen), safe-area-inset-bottom costuma ser 0. */
const ANDROID_FULLSCREEN_MIN = 28

function isDocumentFullscreen(): boolean {
  const doc = document as Document & { webkitFullscreenElement?: Element | null }
  return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement)
}

export function useBottomTabInset(): number {
  const insets = useSafeAreaInsets()
  const [fullscreen, setFullscreen] = useState(isDocumentFullscreen)

  useEffect(() => {
    const sync = () => setFullscreen(isDocumentFullscreen())
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])

  const bottom = insets.bottom

  if (isAndroidWeb()) {
    if (fullscreen) {
      return Math.max(bottom, ANDROID_FULLSCREEN_MIN)
    }
    return Math.max(bottom, ANDROID_BROWSER_MIN)
  }

  return Math.max(bottom, DEFAULT_MIN)
}

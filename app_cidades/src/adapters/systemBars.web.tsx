import { useEffect } from 'react'
import type { AppSystemBarsProps } from './systemBars.types'
import { WEB_CHROME_COLOR, applyWebChromeColor } from './webChromeTheme.web'

/** Web: theme-color (topo) + meta color-scheme (base Android PWA). */
export function AppSystemBars(_props: AppSystemBarsProps) {
  useEffect(() => {
    applyWebChromeColor(WEB_CHROME_COLOR)

    const refresh = () => applyWebChromeColor(WEB_CHROME_COLOR)
    window.addEventListener('visibilitychange', refresh)
    window.addEventListener('pageshow', refresh)
    window.visualViewport?.addEventListener('resize', refresh)

    const standaloneQuery = window.matchMedia('(display-mode: standalone)')
    standaloneQuery.addEventListener?.('change', refresh)

    return () => {
      window.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('pageshow', refresh)
      window.visualViewport?.removeEventListener('resize', refresh)
      standaloneQuery.removeEventListener?.('change', refresh)
    }
  }, [])

  return null
}

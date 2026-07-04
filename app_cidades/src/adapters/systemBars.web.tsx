import { useEffect } from 'react'
import type { AppSystemBarsProps } from './systemBars.types'
import { WEB_CHROME_COLOR, applyWebChromeColor } from './webChromeTheme.web'

/** Web: só aplica theme-color / manifest — sem faixas extras sobre a UI. */
export function AppSystemBars(_props: AppSystemBarsProps) {
  useEffect(() => {
    applyWebChromeColor(WEB_CHROME_COLOR)

    const refresh = () => applyWebChromeColor(WEB_CHROME_COLOR)
    window.addEventListener('visibilitychange', refresh)
    window.visualViewport?.addEventListener('resize', refresh)

    return () => {
      window.removeEventListener('visibilitychange', refresh)
      window.visualViewport?.removeEventListener('resize', refresh)
    }
  }, [])

  return null
}

import { useEffect } from 'react'
import { applyWebChromeColor, WEB_CHROME_COLOR } from '../adapters/webChromeTheme.web'

export function applyAndroidNavigationBar() {
  applyWebChromeColor(WEB_CHROME_COLOR)
}

export function applyAndroidNavigationBarForModal() {
  applyWebChromeColor(WEB_CHROME_COLOR)
}

export function useAndroidNavigationBar() {
  useEffect(() => {
    applyAndroidNavigationBar()
  }, [])
}

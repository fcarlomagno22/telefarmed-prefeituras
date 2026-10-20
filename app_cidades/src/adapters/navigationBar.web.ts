import type { NavigationBarButtonStyle } from './navigationBar.types'
import { colors } from '../theme/colors'
import { WEB_APP_BACKGROUND, WEB_CHROME_COLOR, applyWebChromeColor } from './webChromeTheme.web'

export async function setNavigationBarBackgroundColorAsync(color: string): Promise<void> {
  applyWebChromeColor(WEB_CHROME_COLOR, color, { colorScheme: 'light' })
}

export async function setNavigationBarButtonStyleAsync(
  style: NavigationBarButtonStyle,
): Promise<void> {
  if (style === 'dark') {
    applyWebChromeColor(WEB_CHROME_COLOR, WEB_APP_BACKGROUND, { colorScheme: 'light' })
    return
  }

  applyWebChromeColor(WEB_CHROME_COLOR, colors.background, { colorScheme: 'light' })
}

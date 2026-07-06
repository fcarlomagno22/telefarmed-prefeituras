import type { NavigationBarButtonStyle } from './navigationBar.types'
import { colors } from '../theme/colors'
import { WEB_CHROME_COLOR, applyWebChromeColor } from './webChromeTheme.web'

export async function setNavigationBarBackgroundColorAsync(color: string): Promise<void> {
  applyWebChromeColor(color, color, { colorScheme: 'light' })
}

export async function setNavigationBarButtonStyleAsync(
  style: NavigationBarButtonStyle,
): Promise<void> {
  if (style === 'dark') {
    applyWebChromeColor(WEB_CHROME_COLOR, WEB_CHROME_COLOR, { colorScheme: 'light' })
    return
  }

  applyWebChromeColor(colors.background, colors.background, { colorScheme: 'light' })
}

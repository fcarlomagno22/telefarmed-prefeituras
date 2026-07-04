import type { NavigationBarButtonStyle } from './navigationBar.types'
import { WEB_CHROME_COLOR, applyWebChromeColor } from './webChromeTheme.web'

export async function setNavigationBarBackgroundColorAsync(color: string): Promise<void> {
  applyWebChromeColor(color)
}

export async function setNavigationBarButtonStyleAsync(
  style: NavigationBarButtonStyle,
): Promise<void> {
  // Chrome Android usa theme-color; ícones claros combinam com fundo escuro.
  if (style === 'light') {
    applyWebChromeColor(WEB_CHROME_COLOR)
  }
}

import { colors } from '../theme/colors'

/** Mesma cor do app — Chrome Android pinta a barra de navegação do sistema com theme-color. */
export const WEB_CHROME_COLOR = colors.background
export const WEB_APP_BACKGROUND = colors.background
const WEB_CHROME_STYLE_ID = 'telefarmed-web-chrome-styles'

export function isAndroidWeb(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
}

export function upsertWebMeta(name: string, content: string, media?: string) {
  if (typeof document === 'undefined') return

  const selector = media
    ? `meta[name="${name}"][media="${media}"]`
    : `meta[name="${name}"]:not([media])`

  let meta = document.querySelector(selector) as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = name
    if (media) meta.media = media
    document.head.appendChild(meta)
  }

  meta.content = content
}

function ensureViewportCoversSafeArea() {
  if (typeof document === 'undefined') return

  let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null
  if (!viewport) {
    viewport = document.createElement('meta')
    viewport.name = 'viewport'
    viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover'
    document.head.appendChild(viewport)
    return
  }

  if (!viewport.content.includes('viewport-fit=cover')) {
    viewport.content = `${viewport.content}, viewport-fit=cover`
  }
}

function ensureWebManifestLink() {
  if (typeof document === 'undefined') return

  let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.rel = 'manifest'
    document.head.appendChild(link)
  }

  link.href = '/manifest.webmanifest'
}

function ensureWebChromeStyles(appBackground: string) {
  if (typeof document === 'undefined') return

  let style = document.getElementById(WEB_CHROME_STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = WEB_CHROME_STYLE_ID
    document.head.appendChild(style)
  }

  style.textContent = `
    html {
      background-color: ${appBackground};
      color-scheme: dark;
    }
    body {
      background-color: ${appBackground} !important;
      min-height: 100%;
      min-height: 100dvh;
    }
    #root,
    #root > div {
      background-color: ${appBackground};
      min-height: 100%;
      min-height: 100dvh;
    }
  `
}

function applyThemeColorMeta(color: string) {
  upsertWebMeta('theme-color', color)
  upsertWebMeta('theme-color', color, '(prefers-color-scheme: light)')
  upsertWebMeta('theme-color', color, '(prefers-color-scheme: dark)')
}

/**
 * Chrome Android usa theme-color para a barra de endereço e, em HTTPS/PWA, a barra de navegação.
 * Não desenhamos faixa extra no app — isso criava preto + branco empilhados.
 */
export function applyWebChromeColor(
  chromeColor: string = WEB_CHROME_COLOR,
  appBackground: string = WEB_APP_BACKGROUND,
) {
  if (typeof document === 'undefined') return

  applyThemeColorMeta(chromeColor)
  upsertWebMeta('color-scheme', 'dark')
  upsertWebMeta('mobile-web-app-capable', 'yes')
  upsertWebMeta('apple-mobile-web-app-capable', 'yes')
  upsertWebMeta('apple-mobile-web-app-status-bar-style', 'black-translucent')

  ensureViewportCoversSafeArea()
  ensureWebManifestLink()
  ensureWebChromeStyles(appBackground)

  document.documentElement.style.backgroundColor = appBackground
  document.body.style.backgroundColor = appBackground
}

import { colors } from '../theme/colors'

/** Cor das barras do sistema (status + navegação Android em PWA). */
export const WEB_CHROME_COLOR = colors.background
export const WEB_APP_BACKGROUND = colors.background
const WEB_CHROME_STYLE_ID = 'telefarmed-web-chrome-styles'

export function isAndroidWeb(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
}

export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** Android Chrome — PWA instalado ou site aberto no navegador. */
export function shouldUseAndroidWebImmersive(): boolean {
  return isAndroidWeb()
}

function isAlreadyFullscreen(): boolean {
  if (typeof document === 'undefined') return false

  const doc = document as Document & { webkitFullscreenElement?: Element | null }
  return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement)
}

/** Esconde a barra de 3 botões no Android PWA (meta tags não funcionam nesse modo). */
export function requestAndroidPwaFullscreen(): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('no document'))
  }
  if (isAlreadyFullscreen()) {
    return Promise.resolve()
  }

  const el = document.documentElement
  const webkitEl = el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }
  const reqFullscreen =
    el.requestFullscreen?.bind(el) ?? webkitEl.webkitRequestFullscreen?.bind(el)

  if (!reqFullscreen) {
    return Promise.reject(new Error('fullscreen unavailable'))
  }

  try {
    return reqFullscreen({ navigationUI: 'hide' } as FullscreenOptions)
  } catch {
    return reqFullscreen()
  }
}

export function upsertWebMeta(name: string, content: string) {
  if (typeof document === 'undefined') return

  let meta = document.querySelector(`meta[name="${name}"]:not([media])`) as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = name
    document.head.appendChild(meta)
  }

  meta.content = content
}

function removeMediaScopedChromeMetas() {
  if (typeof document === 'undefined') return

  document.querySelectorAll('meta[name="theme-color"][media]').forEach((node) => {
    node.remove()
  })
  document.querySelectorAll('meta[name="color-scheme"][media]').forEach((node) => {
    node.remove()
  })
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
      color-scheme: dark only;
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
    @media (display-mode: fullscreen) {
      html {
        padding-top: env(safe-area-inset-top, 0px);
      }
    }
  `
}

/**
 * Android PWA standalone:
 * - theme-color → barra de status (topo)
 * - meta color-scheme=dark → barra de navegação com gestos
 * - navegação 3-botões ignora meta/CSS — use requestAndroidPwaFullscreen()
 */
export function applyWebChromeColor(
  chromeColor: string = WEB_CHROME_COLOR,
  appBackground: string = WEB_APP_BACKGROUND,
) {
  if (typeof document === 'undefined') return

  removeMediaScopedChromeMetas()
  upsertWebMeta('theme-color', chromeColor)
  upsertWebMeta('color-scheme', 'dark')
  upsertWebMeta('mobile-web-app-capable', 'yes')
  upsertWebMeta('apple-mobile-web-app-capable', 'yes')
  upsertWebMeta('apple-mobile-web-app-status-bar-style', 'black-translucent')

  ensureViewportCoversSafeArea()
  ensureWebManifestLink()
  ensureWebChromeStyles(appBackground)

  document.documentElement.style.colorScheme = 'dark only'
  document.documentElement.style.backgroundColor = appBackground
  if (document.body) {
    document.body.style.backgroundColor = appBackground
  }
}

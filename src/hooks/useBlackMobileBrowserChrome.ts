import { useEffect } from 'react'

const BLACK = '#000000'

function ensureMeta(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`)
  const previous = meta?.getAttribute('content') ?? null

  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', name)
    document.head.appendChild(meta)
  }

  meta.setAttribute('content', content)
  return { meta, previous }
}

/** Pinta a chrome do navegador mobile (barra de status/endereço) de preto. */
export function useBlackMobileBrowserChrome() {
  useEffect(() => {
    const theme = ensureMeta('theme-color', BLACK)
    const apple = ensureMeta('apple-mobile-web-app-status-bar-style', 'black')
    const prevHtmlBg = document.documentElement.style.backgroundColor
    const prevBodyBg = document.body.style.backgroundColor

    document.documentElement.style.backgroundColor = BLACK
    document.body.style.backgroundColor = BLACK

    return () => {
      if (theme.previous) theme.meta.setAttribute('content', theme.previous)
      else theme.meta.remove()

      if (apple.previous) apple.meta.setAttribute('content', apple.previous)
      else apple.meta.remove()

      document.documentElement.style.backgroundColor = prevHtmlBg
      document.body.style.backgroundColor = prevBodyBg
    }
  }, [])
}

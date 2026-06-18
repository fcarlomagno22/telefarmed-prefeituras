import { useEffect } from 'react'
import { brand } from '../config/brand'

/** Atualiza o favicon da aba conforme o branding do tenant/entidade. */
export function useTenantFavicon(faviconUrl?: string | null) {
  useEffect(() => {
    const href = faviconUrl?.trim() || brand.faviconUrl

    let link =
      document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
      document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')

    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }

    link.href = href
  }, [faviconUrl])
}

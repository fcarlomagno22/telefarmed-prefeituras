import { appEnv } from '../config/env'
import { isValidLiveShareToken, normalizeLiveShareToken } from './runWalkLiveShareToken'

export const LIVE_SHARE_APP_SCHEME = 'telefarmedcidades'
const LIVE_SHARE_WEB_HOST_PATTERN = /(?:^|\.)telefarmed\.com\.br$/i

function buildLiveShareWebPath(baseUrl: string, token: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, '')
  if (LIVE_SHARE_WEB_HOST_PATTERN.test(normalizedBase)) {
    return `${normalizedBase}/${token}`
  }
  // Dev/local: portal web expõe /acompanhar/:token (evita conflito com outras rotas).
  return `${normalizedBase}/acompanhar/${token}`
}

export function buildLiveShareViewerAppLink(shareToken: string): string {
  const token = normalizeLiveShareToken(shareToken)
  return `${LIVE_SHARE_APP_SCHEME}://${token}`
}

export function buildLiveShareViewerWebLink(shareToken: string): string | null {
  const token = normalizeLiveShareToken(shareToken)

  if (!__DEV__) {
    return `https://seguranca.telefarmed.com.br/${token}`
  }

  const baseUrl = appEnv.liveShareWebBaseUrl
  if (!baseUrl) {
    return `https://seguranca.telefarmed.com.br/${token}`
  }

  return buildLiveShareWebPath(baseUrl, token)
}

export function buildLiveShareViewerLink(shareToken: string): string {
  const webLink = buildLiveShareViewerWebLink(shareToken)
  if (webLink) return webLink
  return buildLiveShareViewerAppLink(shareToken)
}

export function parseLiveShareViewerLink(url: string): string | null {
  if (!url.trim()) return null

  const decoded = decodeURIComponent(url.trim())

  const legacyMatch = decoded.match(/acompanhar[/:]([A-Z0-9]{6,12})/i)
  if (legacyMatch?.[1]) {
    const token = normalizeLiveShareToken(legacyMatch[1])
    return isValidLiveShareToken(token) ? token : null
  }

  const schemeMatch = decoded.match(
    new RegExp(`^${LIVE_SHARE_APP_SCHEME}://([A-Z0-9]{6,12})`, 'i'),
  )
  if (schemeMatch?.[1]) {
    const token = normalizeLiveShareToken(schemeMatch[1])
    return isValidLiveShareToken(token) ? token : null
  }

  try {
    const parsed = new URL(decoded.includes('://') ? decoded : `https://${decoded}`)
    if (LIVE_SHARE_WEB_HOST_PATTERN.test(parsed.hostname)) {
      const segments = parsed.pathname.replace(/^\//, '').split('/').filter(Boolean)
      const tokenSegment =
        segments[0] === 'acompanhar' ? segments[1] : segments[0]
      if (tokenSegment) {
        const token = normalizeLiveShareToken(tokenSegment)
        return isValidLiveShareToken(token) ? token : null
      }
    }
  } catch {
    // URL inválida — ignora e retorna null abaixo.
  }

  return null
}

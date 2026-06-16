import { appEnv } from '../config/env'
import { isValidLiveShareToken, normalizeLiveShareToken } from './runWalkLiveShareToken'

export const LIVE_SHARE_APP_SCHEME = 'telefarmedcidades'

export function buildLiveShareViewerAppLink(shareToken: string): string {
  const token = normalizeLiveShareToken(shareToken)
  return `${LIVE_SHARE_APP_SCHEME}://acompanhar/${token}`
}

export function buildLiveShareViewerWebLink(shareToken: string): string | null {
  const baseUrl = appEnv.liveShareWebBaseUrl
  if (!baseUrl) return null

  const token = normalizeLiveShareToken(shareToken)
  return `${baseUrl.replace(/\/$/, '')}/acompanhar/${token}`
}

export function buildLiveShareViewerLink(shareToken: string): string {
  const webLink = buildLiveShareViewerWebLink(shareToken)
  if (webLink) return webLink
  return buildLiveShareViewerAppLink(shareToken)
}

export function parseLiveShareViewerLink(url: string): string | null {
  if (!url.trim()) return null

  const decoded = decodeURIComponent(url.trim())

  const match = decoded.match(/acompanhar[/:]([A-Z0-9]{6,12})/i)
  if (!match?.[1]) return null

  const token = normalizeLiveShareToken(match[1])
  return isValidLiveShareToken(token) ? token : null
}

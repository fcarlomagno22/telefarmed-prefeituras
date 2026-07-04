import { parseNavigationFromUrl } from '../adapters/webNavigationUrl'
import type { AppRouteParams, AppScreen } from '../types/auth'
import { parseLiveShareViewerLink } from './runWalkLiveShareLink'

export type ResolvedIncomingAppLink =
  | { kind: 'live-share'; token: string }
  | { kind: 'route'; screen: AppScreen; params: AppRouteParams | null }

export function resolveIncomingAppLink(url: string): ResolvedIncomingAppLink | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  const shareToken = parseLiveShareViewerLink(trimmed)
  if (shareToken) {
    return { kind: 'live-share', token: shareToken }
  }

  const route = parseNavigationFromUrl(trimmed)
  if (route) {
    return { kind: 'route', screen: route.screen, params: route.params }
  }

  return null
}

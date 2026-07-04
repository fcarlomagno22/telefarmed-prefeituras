import type { AppRouteParams, AppScreen } from '../types/auth'
import type { WebNavigationHistoryEntry } from './webNavigationUrl.types'

export function configureWebNavigationHistory(_options: {
  getScreen: () => string
  getRouteParams: () => AppRouteParams | null
  getCanGoBack: () => boolean
  onBrowserHistoryNavigate?: (entry: WebNavigationHistoryEntry) => void
}) {}

export function ensureWebNavigationHistoryListener() {}

export function syncInitialNavigationHistoryState(
  _screen: AppScreen,
  _params: AppRouteParams | null,
) {}

export function pushNavigationHistoryState(
  _screen: AppScreen,
  _params: AppRouteParams | null,
) {}

export function resetNavigationHistoryState(
  _screen: AppScreen,
  _params: AppRouteParams | null,
) {}

export function navigateBackInBrowserHistory() {}

export function shouldSyncBrowserHistoryOnBack() {
  return true
}

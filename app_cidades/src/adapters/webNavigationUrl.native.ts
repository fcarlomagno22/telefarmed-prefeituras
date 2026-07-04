import type { AppRouteParams, AppScreen } from '../types/auth'
import type { MinimalWebRouteScreen } from '../config/webRoutes'
import type { WebNavigationLocation } from './webNavigationUrl.types'

export function buildMinimalWebRouteUrl(
  _screen: MinimalWebRouteScreen,
  _params: AppRouteParams | null,
): string {
  return ''
}

export function parseMinimalWebRouteFromUrl(_url: string): WebNavigationLocation | null {
  return null
}

export function parseMinimalWebRouteFromCurrentUrl(): WebNavigationLocation | null {
  return null
}

export function buildNavigationUrl(_screen: AppScreen, _params: AppRouteParams | null): string {
  return ''
}

export function parseNavigationFromUrl(_url: string): WebNavigationLocation | null {
  return null
}

export function parseNavigationFromCurrentUrl(): WebNavigationLocation | null {
  return null
}

export function readNavigationEntryFromHistoryState(_state: unknown): WebNavigationLocation | null {
  return null
}

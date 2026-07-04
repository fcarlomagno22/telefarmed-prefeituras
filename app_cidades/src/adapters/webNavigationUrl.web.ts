import type { AppRouteParams, AppScreen } from '../types/auth'
import {
  isMinimalWebRouteScreen,
  WEB_ROUTE_PATHS,
  type MinimalWebRouteScreen,
} from '../config/webRoutes'
import { parseLiveShareTokenFromWebPath } from '../utils/runWalkLiveShareLink'
import type { WebNavigationLocation } from './webNavigationUrl.types'

function getLocationBase(location: Location) {
  return `${location.origin}${location.pathname}${location.search}`
}

function parseLiveShareTokenFromPath(path: string): string | null {
  return parseLiveShareTokenFromWebPath(path.startsWith('/') ? path : `/${path}`)
}

function parseHashMinimalRoute(hash: string): WebNavigationLocation | null {
  const normalized = hash.replace(/^#/, '').trim()
  if (!normalized || normalized === '/') {
    return { screen: 'home', params: null }
  }

  const [pathPart] = normalized.split('?')
  const path = pathPart.replace(/^\//, '')

  if (path === WEB_ROUTE_PATHS.login.replace(/^\//, '')) {
    return { screen: 'login', params: null }
  }

  if (path.startsWith(`${WEB_ROUTE_PATHS.liveShareViewerPrefix.replace(/^\//, '')}/`)) {
    const token = parseLiveShareTokenFromPath(`/${path}`)
    if (!token) return null
    return { screen: 'run-walk-live-viewer', params: { token } }
  }

  return null
}

function parsePathnameMinimalRoute(pathname: string): WebNavigationLocation | null {
  const token = parseLiveShareTokenFromPath(pathname)
  if (token) {
    return { screen: 'run-walk-live-viewer', params: { token } }
  }

  if (pathname === WEB_ROUTE_PATHS.login || pathname === `${WEB_ROUTE_PATHS.login}/`) {
    return { screen: 'login', params: null }
  }

  if (pathname === WEB_ROUTE_PATHS.home || pathname === '') {
    return { screen: 'home', params: null }
  }

  return null
}

export function parseMinimalWebRouteFromUrl(url: string): WebNavigationLocation | null {
  try {
    const parsed = new URL(url)

    const hashRoute = parseHashMinimalRoute(parsed.hash)
    if (hashRoute) return hashRoute

    return parsePathnameMinimalRoute(parsed.pathname)
  } catch {
    return null
  }
}

export function parseMinimalWebRouteFromCurrentUrl(): WebNavigationLocation | null {
  if (typeof window === 'undefined') return null
  return parseMinimalWebRouteFromUrl(window.location.href)
}

export function buildMinimalWebRouteUrl(
  screen: MinimalWebRouteScreen,
  params: AppRouteParams | null,
  location: Location = window.location,
): string {
  const base = getLocationBase(location)

  if (screen === 'run-walk-live-viewer') {
    const token = params && 'token' in params ? params.token : undefined
    if (token) {
      return `${base}#${WEB_ROUTE_PATHS.liveShareViewerPrefix}/${encodeURIComponent(token)}`
    }
  }

  if (screen === 'login') {
    return `${base}#${WEB_ROUTE_PATHS.login}`
  }

  return `${base}#${WEB_ROUTE_PATHS.home}`
}

export function buildNavigationUrl(
  screen: AppScreen,
  params: AppRouteParams | null,
  location: Location = window.location,
): string {
  if (isMinimalWebRouteScreen(screen)) {
    return buildMinimalWebRouteUrl(screen, params, location)
  }

  const base = getLocationBase(location)
  const hash = location.hash || `#${WEB_ROUTE_PATHS.home}`
  return `${base}${hash}`
}

export function parseNavigationFromUrl(url: string): WebNavigationLocation | null {
  return parseMinimalWebRouteFromUrl(url)
}

export function parseNavigationFromCurrentUrl(): WebNavigationLocation | null {
  return parseMinimalWebRouteFromCurrentUrl()
}

export function readNavigationEntryFromHistoryState(
  state: unknown,
  location: Location = window.location,
): WebNavigationLocation | null {
  if (state && typeof state === 'object') {
    const candidate = state as {
      telefarmedNavigation?: boolean
      screen?: string
      params?: AppRouteParams | null
    }

    if (candidate.telefarmedNavigation && candidate.screen) {
      return {
        screen: candidate.screen as AppScreen,
        params: candidate.params ?? null,
      }
    }
  }

  return parseHashMinimalRoute(location.hash)
}

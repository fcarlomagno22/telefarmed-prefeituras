import { hasBackHandlers, runBackHandlers } from '../hooks/backHandlerStack'
import type { AppRouteParams, AppScreen } from '../types/auth'
import {
  buildNavigationUrl,
  readNavigationEntryFromHistoryState,
  type WebNavigationHistoryEntry,
} from './webNavigationUrl'

type WebNavigationOptions = {
  getScreen: () => string
  getRouteParams: () => AppRouteParams | null
  getCanGoBack: () => boolean
  onBrowserHistoryNavigate?: (entry: WebNavigationHistoryEntry) => void
}

let historyIndex = 0
let skipNextPopState = false
let listenerInitialized = false
let handlingBrowserPopState = false
let getScreen: (() => string) | null = null
let getRouteParams: (() => AppRouteParams | null) | null = null
let getCanGoBack: (() => boolean) | null = null
let onBrowserHistoryNavigate: ((entry: WebNavigationHistoryEntry) => void) | null = null

function writeHistoryState(
  method: 'push' | 'replace',
  screen: AppScreen,
  params: AppRouteParams | null,
) {
  if (method === 'push') {
    historyIndex += 1
  }

  const url = buildNavigationUrl(screen, params)
  const state = {
    telefarmedNavigation: true,
    index: historyIndex,
    screen,
    params,
  }

  if (method === 'push') {
    window.history.pushState(state, '', url)
    return
  }

  window.history.replaceState(state, '', url)
}

function restoreCurrentLocation(screen: AppScreen, params: AppRouteParams | null) {
  writeHistoryState('push', screen, params)
}

function handlePopState(event: PopStateEvent) {
  if (skipNextPopState) {
    skipNextPopState = false
    return
  }

  if (!hasBackHandlers()) {
    const entry = readNavigationEntryFromHistoryState(event.state, window.location)
    if (entry) {
      onBrowserHistoryNavigate?.(entry)
      return
    }

    restoreCurrentLocation(
      (getScreen?.() ?? 'home') as AppScreen,
      getRouteParams?.() ?? null,
    )
    return
  }

  const screenBefore = getScreen?.() ?? ''
  handlingBrowserPopState = true

  let handled = false
  try {
    handled = runBackHandlers()
  } finally {
    handlingBrowserPopState = false
  }

  if (!handled) {
    const entry = readNavigationEntryFromHistoryState(event.state, window.location)
    if (entry) {
      onBrowserHistoryNavigate?.(entry)
      return
    }

    restoreCurrentLocation(
      (getScreen?.() ?? 'home') as AppScreen,
      getRouteParams?.() ?? null,
    )
    return
  }

  const screenAfter = getScreen?.() ?? ''
  if (screenBefore === screenAfter && getCanGoBack?.()) {
    restoreCurrentLocation(screenBefore as AppScreen, getRouteParams?.() ?? null)
  }
}

export function configureWebNavigationHistory(options: WebNavigationOptions) {
  getScreen = options.getScreen
  getRouteParams = options.getRouteParams
  getCanGoBack = options.getCanGoBack
  onBrowserHistoryNavigate = options.onBrowserHistoryNavigate ?? null
}

export function ensureWebNavigationHistoryListener() {
  if (listenerInitialized || typeof window === 'undefined') return

  listenerInitialized = true
  window.addEventListener('popstate', handlePopState)
}

export function syncInitialNavigationHistoryState(
  screen: AppScreen,
  params: AppRouteParams | null,
) {
  if (typeof window === 'undefined') return

  window.history.replaceState(
    {
      telefarmedNavigation: true,
      index: historyIndex,
      screen,
      params,
    },
    '',
    buildNavigationUrl(screen, params),
  )
}

export function pushNavigationHistoryState(screen: AppScreen, params: AppRouteParams | null) {
  if (typeof window === 'undefined') return
  writeHistoryState('push', screen, params)
}

export function resetNavigationHistoryState(screen: AppScreen, params: AppRouteParams | null) {
  if (typeof window === 'undefined') return
  writeHistoryState('replace', screen, params)
}

export function navigateBackInBrowserHistory() {
  if (typeof window === 'undefined') return

  skipNextPopState = true
  window.history.back()
}

export function shouldSyncBrowserHistoryOnBack() {
  return !handlingBrowserPopState
}

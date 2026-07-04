import type { AppRouteParams, AppScreen } from '../types/auth'

export type WebNavigationLocation = {
  screen: AppScreen
  params: AppRouteParams | null
}

export type WebNavigationHistoryEntry = WebNavigationLocation

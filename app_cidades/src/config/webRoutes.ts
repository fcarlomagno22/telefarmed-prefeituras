import type { AppScreen } from '../types/auth'

export type MinimalWebRouteScreen = 'home' | 'login' | 'run-walk-live-viewer'

export const WEB_MINIMAL_ROUTE_SCREENS = [
  'home',
  'login',
  'run-walk-live-viewer',
] as const satisfies readonly MinimalWebRouteScreen[]

export const WEB_ROUTE_PATHS = {
  home: '/',
  login: '/login',
  liveShareViewerPrefix: '/acompanhar',
} as const

export function isMinimalWebRouteScreen(screen: AppScreen): screen is MinimalWebRouteScreen {
  return (WEB_MINIMAL_ROUTE_SCREENS as readonly AppScreen[]).includes(screen)
}

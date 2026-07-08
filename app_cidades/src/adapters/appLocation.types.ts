export enum AppLocationAccuracy {
  Lowest = 1,
  Low = 2,
  Balanced = 3,
  High = 4,
  Highest = 5,
  BestForNavigation = 6,
}

export type AppLocationWatchOptions = {
  accuracy?: AppLocationAccuracy
  distanceInterval?: number
  /** Android only — iOS uses distanceInterval + accuracy. */
  timeInterval?: number
  /**
   * Android only — prompts to enable device location / high accuracy mode when disabled.
   * @platform android
   */
  mayShowUserSettingsDialog?: boolean
}

/** iOS returns -1 for invalid speed; treat as null so distance/time fallback runs. */
export function normalizeLocationSpeedMps(speed: number | null | undefined): number | null {
  if (speed == null || !Number.isFinite(speed) || speed < 0) return null
  return speed
}

/** iOS returns -1 for invalid course heading. */
export function normalizeLocationHeadingDegrees(
  heading: number | null | undefined,
): number | null {
  if (heading == null || !Number.isFinite(heading) || heading < 0) return null
  return heading % 360
}

export type AppLocationCoords = {
  latitude: number
  longitude: number
  altitude: number | null
  accuracy: number | null
  altitudeAccuracy: number | null
  heading: number | null
  speed: number | null
}

export type AppLocationObject = {
  coords: AppLocationCoords
  timestamp: number
}

export type AppLocationGeocodedAddress = {
  city: string | null
  district: string | null
  streetNumber: string | null
  street: string | null
  region: string | null
  subregion: string | null
  country: string | null
  postalCode: string | null
  name: string | null
  isoCountryCode: string | null
}

export type AppLocationGeocodedLocation = {
  latitude: number
  longitude: number
  altitude?: number
  accuracy?: number
}

export type AppLocationPermissionResponse = {
  granted: boolean
  status: 'granted' | 'denied' | 'undetermined'
  canAskAgain: boolean
}

/** Na web, o prompt do navegador só aparece ao chamar getCurrentPosition (status undetermined). */
export function isAppLocationPermissionDenied(
  response: AppLocationPermissionResponse,
): boolean {
  return response.status === 'denied'
}

export function getAppLocationFailureReason(error: unknown): AppLocationFailureReason | null {
  if (
    error &&
    typeof error === 'object' &&
    'reason' in error &&
    typeof (error as { reason: unknown }).reason === 'string'
  ) {
    return (error as { reason: AppLocationFailureReason }).reason
  }

  return null
}

export type AppLocationSubscription = {
  remove: () => void
}

export type AppLocationHeading = {
  trueHeading: number
  magHeading: number
  accuracy: number
}

export type AppLocationHeadingSource = 'compass' | 'course' | 'none'

export type AppLocationHeadingSupport = {
  compass: boolean
  course: boolean
  preferredSource: AppLocationHeadingSource
}

export type AppLocationFailureReason =
  | 'unsupported'
  | 'insecure_context'
  | 'permission_denied'
  | 'unavailable'
  | 'timeout'

export const APP_LOCATION_WEB_LIMITATIONS = {
  heading:
    'Na web a bússola depende do navegador/dispositivo; quando indisponível, o mapa usa o sentido do movimento (GPS).',
  watch:
    'Atualizações contínuas na web usam watchPosition com recuperação automática por polling quando o navegador interrompe o sinal.',
  geocoding:
    'Endereços na web usam OpenStreetMap (Nominatim) e podem ser menos precisos que no app nativo.',
  reverseGeocode:
    'Se o reverse geocoding falhar ou não for confiável na web, o app usa coordenadas ou dados já conhecidos do usuário.',
  precision:
    'No navegador a precisão depende do GPS/Wi‑Fi disponível; localização de rede pode ser imprecisa (10–100m+). O app nativo é significativamente mais preciso para corrida/caminhada.',
  liveTracking:
    'Tracking live na web degrada gracefully: pin pode saltar, velocidade usa fallback distância/tempo, trail commita com filtros anti-drift. Recomenda-se app nativo para melhor UX.',
  safariIos:
    'Safari iOS: permissão de geolocalização via prompt do navegador; DeviceOrientation (bússola) exige gesto do usuário (iOS 13+) e pode falhar — heading cai back para curso GPS.',
  secureContext: 'Localização na web exige HTTPS ou localhost.',
  map:
    'Mapa live na web usa Leaflet DOM direto (sem WebView), com follow ~60fps via requestAnimationFrame e cap de inject a 16ms.',
} as const

export function getAppLocationFailureMessage(reason: AppLocationFailureReason): string {
  switch (reason) {
    case 'unsupported':
      return 'Este navegador não suporta geolocalização.'
    case 'insecure_context':
      return APP_LOCATION_WEB_LIMITATIONS.secureContext
    case 'permission_denied':
      return 'Permita o acesso à localização nas configurações do navegador.'
    case 'timeout':
      return 'Tempo esgotado ao obter a localização. Tente novamente.'
    default:
      return 'Não foi possível obter sua localização.'
  }
}

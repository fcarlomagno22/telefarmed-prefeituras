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
  timeInterval?: number
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
    'No navegador a precisão depende do GPS/Wi‑Fi disponível; localização de rede pode ser imprecisa.',
  secureContext: 'Localização na web exige HTTPS ou localhost.',
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

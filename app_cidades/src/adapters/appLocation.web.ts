/**
 * Web: navigator.geolocation para posição; Nominatim para geocoding.
 * watchPositionAsync usa recuperação por polling; heading usa bússola quando
 * disponível, senão curso GPS enriquecido no watcher de posição.
 */
import {
  isWebHeadingLikelyAvailable,
  startWebHeadingWatcher,
  startWebPositionWatcher,
} from './appLocationWatch.web'
import {
  isReverseGeocodeAvailable,
  reverseGeocodeOnWeb,
} from './appLocationReverseGeocode.web'
import type {
  AppLocationGeocodedAddress,
  AppLocationGeocodedLocation,
  AppLocationHeading,
  AppLocationObject,
  AppLocationPermissionResponse,
  AppLocationSubscription,
  AppLocationWatchOptions,
} from './appLocation.types'
import {
  APP_LOCATION_WEB_LIMITATIONS,
  AppLocationAccuracy,
  getAppLocationFailureReason,
  type AppLocationFailureReason,
  type AppLocationHeadingSupport,
} from './appLocation.types'

export {
  APP_LOCATION_WEB_LIMITATIONS,
  AppLocationAccuracy,
  getAppLocationFailureMessage,
  getAppLocationFailureReason,
  isAppLocationPermissionDenied,
} from './appLocation.types'
export type {
  AppLocationCoords,
  AppLocationFailureReason,
  AppLocationGeocodedAddress,
  AppLocationGeocodedLocation,
  AppLocationHeading,
  AppLocationHeadingSource,
  AppLocationHeadingSupport,
  AppLocationObject,
  AppLocationPermissionResponse,
  AppLocationSubscription,
  AppLocationWatchOptions,
} from './appLocation.types'

export const Accuracy = AppLocationAccuracy

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const NOMINATIM_HEADERS = {
  Accept: 'application/json',
  'Accept-Language': 'pt-BR,pt;q=0.9',
}

class AppLocationError extends Error {
  readonly reason: AppLocationFailureReason

  constructor(reason: AppLocationFailureReason, message?: string) {
    super(message ?? reason)
    this.name = 'AppLocationError'
    this.reason = reason
  }
}

function assertBrowserGeolocation(): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    throw new AppLocationError('unsupported')
  }

  if (!window.isSecureContext) {
    throw new AppLocationError('insecure_context', APP_LOCATION_WEB_LIMITATIONS.secureContext)
  }

  if (!('geolocation' in navigator) || !navigator.geolocation) {
    throw new AppLocationError('unsupported')
  }
}

function accuracySettings(accuracy?: AppLocationAccuracy): {
  enableHighAccuracy: boolean
  timeout: number
  maximumAge: number
} {
  switch (accuracy) {
    case AppLocationAccuracy.BestForNavigation:
    case AppLocationAccuracy.Highest:
    case AppLocationAccuracy.High:
      return { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    case AppLocationAccuracy.Lowest:
    case AppLocationAccuracy.Low:
      return { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    case AppLocationAccuracy.Balanced:
    default:
      return { enableHighAccuracy: false, timeout: 12000, maximumAge: 15000 }
  }
}

function mapGeolocationError(error: GeolocationPositionError): AppLocationError {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return new AppLocationError('permission_denied')
    case error.TIMEOUT:
      return new AppLocationError('timeout')
    default:
      return new AppLocationError('unavailable')
  }
}

function toLocationObject(position: GeolocationPosition): AppLocationObject {
  return {
    timestamp: position.timestamp,
    coords: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude,
      accuracy: position.coords.accuracy ?? null,
      altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
      heading: position.coords.heading ?? null,
      speed: position.coords.speed ?? null,
    },
  }
}

export function isAppLocationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    window.isSecureContext &&
    'geolocation' in navigator &&
    Boolean(navigator.geolocation)
  )
}

export async function getForegroundPermissionsAsync(): Promise<AppLocationPermissionResponse> {
  if (!isAppLocationSupported()) {
    return { granted: false, status: 'denied', canAskAgain: false }
  }

  if (navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' })
      if (status.state === 'granted') {
        return { granted: true, status: 'granted', canAskAgain: true }
      }
      if (status.state === 'denied') {
        return { granted: false, status: 'denied', canAskAgain: false }
      }
      return { granted: false, status: 'undetermined', canAskAgain: true }
    } catch {
      return { granted: false, status: 'undetermined', canAskAgain: true }
    }
  }

  return { granted: false, status: 'undetermined', canAskAgain: true }
}

export async function requestForegroundPermissionsAsync(): Promise<AppLocationPermissionResponse> {
  return getForegroundPermissionsAsync()
}

export async function enableNetworkProviderAsync(): Promise<void> {
  return undefined
}

function buildAccuracyFallbackChain(
  requested: AppLocationAccuracy,
): AppLocationAccuracy[] {
  switch (requested) {
    case AppLocationAccuracy.BestForNavigation:
    case AppLocationAccuracy.Highest:
      return [
        requested,
        AppLocationAccuracy.High,
        AppLocationAccuracy.Balanced,
        AppLocationAccuracy.Low,
      ]
    case AppLocationAccuracy.High:
      return [AppLocationAccuracy.High, AppLocationAccuracy.Balanced, AppLocationAccuracy.Low]
    default:
      return [requested, AppLocationAccuracy.Low]
  }
}

function getCurrentPosition(options: AppLocationWatchOptions): Promise<AppLocationObject> {
  assertBrowserGeolocation()
  const settings = accuracySettings(options.accuracy)

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(toLocationObject(position)),
      (error) => reject(mapGeolocationError(error)),
      settings,
    )
  })
}

export async function getCurrentPositionAsync(
  options: AppLocationWatchOptions = {},
): Promise<AppLocationObject> {
  const requestedAccuracy = options.accuracy ?? AppLocationAccuracy.Balanced
  const chain = buildAccuracyFallbackChain(requestedAccuracy)
  let lastError: unknown

  for (const accuracy of chain) {
    try {
      return await getCurrentPosition({ ...options, accuracy })
    } catch (error) {
      lastError = error
      if (getAppLocationFailureReason(error) === 'permission_denied') {
        throw error
      }
    }
  }

  throw lastError
}

export async function watchPositionAsync(
  options: AppLocationWatchOptions,
  callback: (location: AppLocationObject) => void,
  errorHandler?: (reason: string) => void,
): Promise<AppLocationSubscription> {
  assertBrowserGeolocation()
  return startWebPositionWatcher(options, callback, errorHandler)
}

export async function watchHeadingAsync(
  callback: (heading: AppLocationHeading) => void,
): Promise<AppLocationSubscription> {
  const watcher = await startWebHeadingWatcher((heading) => {
    callback({
      trueHeading: heading,
      magHeading: heading,
      accuracy: 0,
    })
  })

  return {
    remove: () => watcher.remove(),
  }
}

export function getAppLocationHeadingSupport(): AppLocationHeadingSupport {
  const compass = isWebHeadingLikelyAvailable()
  return {
    compass,
    course: true,
    preferredSource: compass ? 'compass' : 'course',
  }
}

export async function reverseGeocodeAsync(location: {
  latitude: number
  longitude: number
}): Promise<AppLocationGeocodedAddress[]> {
  return reverseGeocodeOnWeb(location)
}

export { isReverseGeocodeAvailable }

export async function geocodeAsync(address: string): Promise<AppLocationGeocodedLocation[]> {
  const params = new URLSearchParams({
    format: 'json',
    q: address,
    limit: '1',
    addressdetails: '0',
  })

  const response = await fetch(`${NOMINATIM_BASE}/search?${params.toString()}`, {
    headers: NOMINATIM_HEADERS,
  })

  if (!response.ok) return []

  const results = (await response.json()) as Array<{ lat: string; lon: string }>
  return results
    .map((place) => ({
      latitude: Number.parseFloat(place.lat),
      longitude: Number.parseFloat(place.lon),
    }))
    .filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude))
}

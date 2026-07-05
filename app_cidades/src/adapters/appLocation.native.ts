import * as Location from 'expo-location'
import { isReverseGeocodeAvailable } from './appLocationReverseGeocode'
import type {
  AppLocationGeocodedAddress,
  AppLocationGeocodedLocation,
  AppLocationHeading,
  AppLocationHeadingSupport,
  AppLocationObject,
  AppLocationPermissionResponse,
  AppLocationSubscription,
  AppLocationWatchOptions,
} from './appLocation.types'
import { AppLocationAccuracy } from './appLocation.types'

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

function mapAccuracy(accuracy?: AppLocationAccuracy): Location.LocationAccuracy {
  switch (accuracy) {
    case AppLocationAccuracy.Lowest:
      return Location.Accuracy.Lowest
    case AppLocationAccuracy.Low:
      return Location.Accuracy.Low
    case AppLocationAccuracy.High:
      return Location.Accuracy.High
    case AppLocationAccuracy.Highest:
      return Location.Accuracy.Highest
    case AppLocationAccuracy.BestForNavigation:
      return Location.Accuracy.BestForNavigation
    case AppLocationAccuracy.Balanced:
    default:
      return Location.Accuracy.Balanced
  }
}

function mapPermission(response: Location.LocationPermissionResponse): AppLocationPermissionResponse {
  return {
    granted: response.granted,
    status: response.status,
    canAskAgain: response.canAskAgain,
  }
}

function mapLocationObject(location: Location.LocationObject): AppLocationObject {
  return {
    timestamp: location.timestamp,
    coords: {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude,
      accuracy: location.coords.accuracy,
      altitudeAccuracy: location.coords.altitudeAccuracy,
      heading: location.coords.heading,
      speed: location.coords.speed,
    },
  }
}

function mapGeocodedAddress(place: Location.LocationGeocodedAddress): AppLocationGeocodedAddress {
  return {
    city: place.city,
    district: place.district,
    streetNumber: place.streetNumber,
    street: place.street,
    region: place.region,
    subregion: place.subregion,
    country: place.country,
    postalCode: place.postalCode,
    name: place.name,
    isoCountryCode: place.isoCountryCode,
  }
}

export function isAppLocationSupported(): boolean {
  return true
}

export async function requestForegroundPermissionsAsync(): Promise<AppLocationPermissionResponse> {
  return mapPermission(await Location.requestForegroundPermissionsAsync())
}

export async function enableNetworkProviderAsync(): Promise<void> {
  await Location.enableNetworkProviderAsync()
}

export async function getCurrentPositionAsync(
  options: AppLocationWatchOptions = {},
): Promise<AppLocationObject> {
  const result = await Location.getCurrentPositionAsync({
    accuracy: mapAccuracy(options.accuracy),
    timeInterval: options.timeInterval,
    distanceInterval: options.distanceInterval,
  })

  return mapLocationObject(result)
}

export async function watchPositionAsync(
  options: AppLocationWatchOptions,
  callback: (location: AppLocationObject) => void,
  errorHandler?: (reason: string) => void,
): Promise<AppLocationSubscription> {
  const subscription = await Location.watchPositionAsync(
    {
      accuracy: mapAccuracy(options.accuracy),
      timeInterval: options.timeInterval,
      distanceInterval: options.distanceInterval,
    },
    (location) => callback(mapLocationObject(location)),
    errorHandler,
  )

  return subscription
}

export function getAppLocationHeadingSupport(): AppLocationHeadingSupport {
  return {
    compass: true,
    course: true,
    preferredSource: 'compass',
  }
}

export async function watchHeadingAsync(
  callback: (heading: AppLocationHeading) => void,
): Promise<AppLocationSubscription> {
  return Location.watchHeadingAsync((update) => {
    callback({
      trueHeading: update.trueHeading,
      magHeading: update.magHeading,
      accuracy: update.accuracy,
    })
  })
}

export async function reverseGeocodeAsync(location: {
  latitude: number
  longitude: number
}): Promise<AppLocationGeocodedAddress[]> {
  const results = await Location.reverseGeocodeAsync(location)
  return results.map(mapGeocodedAddress)
}

export async function geocodeAsync(address: string): Promise<AppLocationGeocodedLocation[]> {
  const results = await Location.geocodeAsync(address)
  return results.map((place) => ({
    latitude: place.latitude,
    longitude: place.longitude,
    altitude: place.altitude,
    accuracy: place.accuracy,
  }))
}

export { isReverseGeocodeAvailable }

import * as Location from 'expo-location'
import { useCallback, useEffect, useRef, useState } from 'react'
import { RegistrationAddress } from '../types/auth'
import { GeoCoordinates } from '../utils/geo'
import { getMockGpsCoordinates } from '../utils/nearbyUnits'
import { getHomeCoordinatesFromAddress } from '../utils/mockHomeLocation'

export type GpsQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unavailable'

export type RunWalkLocationState = {
  coordinates: GeoCoordinates | null
  accuracyMeters: number | null
  headingDegrees: number | null
  speedMps: number | null
  gpsQuality: GpsQuality
  cityLabel: string | null
  isLocating: boolean
  isResolvingCity: boolean
  permissionGranted: boolean
  permissionDenied: boolean
  error: string | null
}

function accuracyToQuality(accuracy: number | null): GpsQuality {
  if (accuracy == null) return 'unavailable'
  if (accuracy <= 10) return 'excellent'
  if (accuracy <= 25) return 'good'
  if (accuracy <= 50) return 'fair'
  return 'poor'
}

export function gpsQualityLabel(quality: GpsQuality): string {
  switch (quality) {
    case 'excellent':
      return 'Excelente'
    case 'good':
      return 'Boa'
    case 'fair':
      return 'Regular'
    case 'poor':
      return 'Fraca'
    default:
      return 'Indisponível'
  }
}

async function resolveCityLabel(latitude: number, longitude: number): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude })
    const place = results[0]
    if (!place) return null

    return place.city ?? place.subregion ?? place.region ?? place.district ?? null
  } catch {
    return null
  }
}

export type RunWalkLocationTrackingMode = 'default' | 'activity'

type UseRunWalkLocationOptions = {
  address?: RegistrationAddress
  enabled?: boolean
  trackHeading?: boolean
  trackingMode?: RunWalkLocationTrackingMode
}

const TRACKING_WATCH_OPTIONS: Record<
  RunWalkLocationTrackingMode,
  Pick<Location.LocationOptions, 'distanceInterval' | 'timeInterval'>
> = {
  default: { distanceInterval: 5, timeInterval: 4000 },
  activity: { distanceInterval: 5, timeInterval: 2000 },
}

export function useRunWalkLocation({
  address,
  enabled = true,
  trackHeading = false,
  trackingMode = 'default',
}: UseRunWalkLocationOptions) {
  const [state, setState] = useState<RunWalkLocationState>({
    coordinates: null,
    accuracyMeters: null,
    headingDegrees: null,
    speedMps: null,
    gpsQuality: 'unavailable',
    cityLabel: null,
    isLocating: false,
    isResolvingCity: false,
    permissionGranted: false,
    permissionDenied: false,
    error: null,
  })

  const watchRef = useRef<Location.LocationSubscription | null>(null)
  const headingWatchRef = useRef<Location.LocationSubscription | null>(null)

  const stopWatch = useCallback(() => {
    watchRef.current?.remove()
    watchRef.current = null
  }, [])

  const stopHeadingWatch = useCallback(() => {
    headingWatchRef.current?.remove()
    headingWatchRef.current = null
  }, [])

  const applyPosition = useCallback(
    (latitude: number, longitude: number, accuracy: number | null, heading: number | null, speed: number | null) => {
      setState((prev) => ({
        ...prev,
        coordinates: { latitude, longitude },
        accuracyMeters: accuracy,
        headingDegrees:
          heading != null && Number.isFinite(heading) && heading >= 0
            ? heading % 360
            : prev.headingDegrees,
        speedMps:
          speed != null && Number.isFinite(speed) && speed >= 0 ? speed : prev.speedMps,
        gpsQuality: accuracyToQuality(accuracy),
        isLocating: false,
        isResolvingCity: true,
        error: null,
      }))

    void resolveCityLabel(latitude, longitude).then((cityLabel) => {
      setState((prev) => ({
        ...prev,
        cityLabel,
        isResolvingCity: false,
      }))
    })
  }, [])

  const applyHeading = useCallback((heading: number) => {
    if (!Number.isFinite(heading) || heading < 0) return

    setState((prev) => ({
      ...prev,
      headingDegrees: heading % 360,
    }))
  }, [])

  const requestLocation = useCallback(async () => {
    if (!enabled) return

    setState((prev) => ({ ...prev, isLocating: true, error: null }))

    try {
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        setState((prev) => ({
          ...prev,
          isLocating: false,
          permissionGranted: false,
          permissionDenied: true,
          error: 'Permita o acesso à localização para iniciar a atividade.',
        }))
        return
      }

      setState((prev) => ({ ...prev, permissionGranted: true, permissionDenied: false }))

      await Location.enableNetworkProviderAsync().catch(() => undefined)

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      applyPosition(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.accuracy ?? null,
        position.coords.heading ?? null,
        position.coords.speed ?? null,
      )

      stopWatch()
      const watchOptions = TRACKING_WATCH_OPTIONS[trackingMode]
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: watchOptions.distanceInterval,
          timeInterval: watchOptions.timeInterval,
        },
        (update) => {
          applyPosition(
            update.coords.latitude,
            update.coords.longitude,
            update.coords.accuracy ?? null,
            update.coords.heading ?? null,
            update.coords.speed ?? null,
          )
        },
      )
    } catch {
      const fallback = address ? getHomeCoordinatesFromAddress(address) : null
      if (fallback) {
        const mock = getMockGpsCoordinates(fallback)
        applyPosition(mock.latitude, mock.longitude, 18, null, null)
        setState((prev) => ({
          ...prev,
          permissionGranted: true,
          error: 'Usando localização aproximada. Ative o GPS para maior precisão.',
        }))
        return
      }

      setState((prev) => ({
        ...prev,
        isLocating: false,
        error: 'Não foi possível obter sua localização.',
      }))
    }
  }, [address, applyPosition, enabled, stopWatch, trackingMode])

  useEffect(() => {
    if (enabled) {
      void requestLocation()
    }
    return () => stopWatch()
  }, [enabled, requestLocation, stopWatch])

  useEffect(() => {
    if (!enabled || !trackHeading) {
      stopHeadingWatch()
      return
    }

    let active = true

    void Location.watchHeadingAsync((update) => {
      if (!active) return

      const heading =
        update.trueHeading >= 0 ? update.trueHeading : update.magHeading
      applyHeading(heading)
    })
      .then((subscription) => {
        if (!active) {
          subscription.remove()
          return
        }

        headingWatchRef.current = subscription
      })
      .catch(() => undefined)

    return () => {
      active = false
      stopHeadingWatch()
    }
  }, [applyHeading, enabled, stopHeadingWatch, trackHeading])

  return {
    ...state,
    refreshLocation: requestLocation,
  }
}

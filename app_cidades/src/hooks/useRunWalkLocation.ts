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

type UseRunWalkLocationOptions = {
  address?: RegistrationAddress
  enabled?: boolean
}

export function useRunWalkLocation({ address, enabled = true }: UseRunWalkLocationOptions) {
  const [state, setState] = useState<RunWalkLocationState>({
    coordinates: null,
    accuracyMeters: null,
    gpsQuality: 'unavailable',
    cityLabel: null,
    isLocating: false,
    isResolvingCity: false,
    permissionGranted: false,
    permissionDenied: false,
    error: null,
  })

  const watchRef = useRef<Location.LocationSubscription | null>(null)

  const stopWatch = useCallback(() => {
    watchRef.current?.remove()
    watchRef.current = null
  }, [])

  const applyPosition = useCallback((latitude: number, longitude: number, accuracy: number | null) => {
    setState((prev) => ({
      ...prev,
      coordinates: { latitude, longitude },
      accuracyMeters: accuracy,
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
      )

      stopWatch()
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 4000,
        },
        (update) => {
          applyPosition(
            update.coords.latitude,
            update.coords.longitude,
            update.coords.accuracy ?? null,
          )
        },
      )
    } catch {
      const fallback = address ? getHomeCoordinatesFromAddress(address) : null
      if (fallback) {
        const mock = getMockGpsCoordinates(fallback)
        applyPosition(mock.latitude, mock.longitude, 18)
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
  }, [address, applyPosition, enabled, stopWatch])

  useEffect(() => {
    if (enabled) {
      void requestLocation()
    }
    return () => stopWatch()
  }, [enabled, requestLocation, stopWatch])

  return {
    ...state,
    refreshLocation: requestLocation,
  }
}

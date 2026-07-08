import { Platform } from 'react-native'
import {
  Accuracy,
  enableNetworkProviderAsync,
  getAppLocationFailureReason,
  getAppLocationHeadingSupport,
  getCurrentPositionAsync,
  getForegroundPermissionsAsync,
  isAppLocationPermissionDenied,
  requestForegroundPermissionsAsync,
  reverseGeocodeAsync,
  type AppLocationPermissionResponse,
  type AppLocationSubscription,
  type AppLocationWatchOptions,
  watchHeadingAsync,
  watchPositionAsync,
} from '../adapters/appLocation'
import {
  extractCityLabelFromGeocoded,
  isValidReverseGeocodeCoordinates,
} from '../adapters/reverseGeocodeShared'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createListenerRegistry, type RunWalkGpsFix } from './runWalkLiveGpsFeed'
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
  canAskAgain: boolean
  error: string | null
}

function accuracyToQuality(accuracy: number | null): GpsQuality {
  // Dispositivos e navegadores costumam entregar coordenadas antes da precisão estabilizar.
  if (accuracy == null) return 'fair'
  if (accuracy <= 10) return 'excellent'
  if (accuracy <= 25) return 'good'
  if (accuracy <= 50) return 'fair'
  return 'poor'
}

export function isGpsReadyForActivity(gpsLocated: boolean, permissionGranted = false): boolean {
  return permissionGranted || gpsLocated
}

export function isGpsPermissionReadyForActivity(
  permissionGranted: boolean,
  permissionDenied: boolean,
): boolean {
  return permissionGranted && !permissionDenied
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
  if (!isValidReverseGeocodeCoordinates(latitude, longitude)) {
    return null
  }

  try {
    const results = await reverseGeocodeAsync({ latitude, longitude })
    const place = results[0]
    if (!place) return null

    return extractCityLabelFromGeocoded(place)
  } catch {
    return null
  }
}

export type RunWalkLocationTrackingMode = 'default' | 'activity'
export type RunWalkLocationPositionUpdateMode = 'state' | 'ref'

type UseRunWalkLocationOptions = {
  address?: RegistrationAddress
  enabled?: boolean
  trackHeading?: boolean
  trackingMode?: RunWalkLocationTrackingMode
  /** Uma leitura inicial: sem watch contínuo e sem re-resolver a cidade. */
  snapshot?: boolean
  /** Se falso, só consulta permissão no mount e espera refreshLocation (gesto do usuário). */
  autoRequest?: boolean
  /** ref: GPS bruto em refs + listeners; state: setState a cada fix (default). */
  positionUpdateMode?: RunWalkLocationPositionUpdateMode
}

function permissionDeniedMessage(permission: AppLocationPermissionResponse): string {
  if (permission.status === 'denied' && !permission.canAskAgain) {
    return 'Localização bloqueada. Abra as configurações do aparelho para permitir o acesso.'
  }

  return 'Permita o acesso à localização para iniciar a atividade.'
}

const TRACKING_WATCH_OPTIONS: Record<
  RunWalkLocationTrackingMode,
  Pick<AppLocationWatchOptions, 'distanceInterval' | 'timeInterval' | 'mayShowUserSettingsDialog'>
> = {
  default: { distanceInterval: 5, timeInterval: 4000 },
  activity: {
    // 0 = emit on time cadence only (Waze-like on web); native still benefits from 1 m filter.
    distanceInterval: Platform.OS === 'web' ? 0 : 1,
    timeInterval: Platform.OS === 'web' ? 250 : 300,
    mayShowUserSettingsDialog: true,
  },
}

const REF_MODE_UI_SYNC_MS = 250

export function useRunWalkLocation({
  address,
  enabled = true,
  trackHeading = false,
  trackingMode = 'default',
  snapshot = false,
  autoRequest = true,
  positionUpdateMode = 'state',
}: UseRunWalkLocationOptions) {
  const positionFixRef = useRef<RunWalkGpsFix | null>(null)
  const positionListenersRef = useRef(createListenerRegistry())
  const lastRefModeUiSyncAtRef = useRef(0)
  const useRefPositionUpdates = positionUpdateMode === 'ref'
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
    canAskAgain: true,
    error: null,
  })

  const watchRef = useRef<AppLocationSubscription | null>(null)
  const headingWatchRef = useRef<AppLocationSubscription | null>(null)
  const cityResolvedRef = useRef(false)

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
      const shouldResolveCity = !snapshot || !cityResolvedRef.current
      const now = Date.now()
      const nextHeading =
        heading != null && Number.isFinite(heading) && heading >= 0
          ? heading % 360
          : (positionFixRef.current?.headingDegrees ?? null)
      const normalizedSpeed =
        speed != null && Number.isFinite(speed) && speed >= 0 ? speed : null
      const nextSpeed = normalizedSpeed

      positionFixRef.current = {
        coordinates: { latitude, longitude },
        speedMps: nextSpeed,
        accuracyMeters: accuracy,
        headingDegrees: nextHeading,
        recordedAt: now,
      }

      if (useRefPositionUpdates) {
        positionListenersRef.current.notify()

        if (now - lastRefModeUiSyncAtRef.current >= REF_MODE_UI_SYNC_MS) {
          lastRefModeUiSyncAtRef.current = now
          setState((prev) => ({
            ...prev,
            coordinates: { latitude, longitude },
            accuracyMeters: accuracy,
            headingDegrees: nextHeading ?? prev.headingDegrees,
            speedMps: nextSpeed ?? prev.speedMps,
            gpsQuality: accuracyToQuality(accuracy),
            isLocating: false,
            isResolvingCity: shouldResolveCity,
            permissionGranted: true,
            permissionDenied: false,
            error: null,
          }))
        }

        if (!shouldResolveCity) return

        void resolveCityLabel(latitude, longitude).then((cityLabel) => {
          cityResolvedRef.current = true
          setState((prev) => ({
            ...prev,
            cityLabel,
            isResolvingCity: false,
          }))
        })
        return
      }

      setState((prev) => ({
        ...prev,
        coordinates: { latitude, longitude },
        accuracyMeters: accuracy,
        headingDegrees:
          heading != null && Number.isFinite(heading) && heading >= 0
            ? heading % 360
            : prev.headingDegrees,
        speedMps:
          speed != null && Number.isFinite(speed) && speed >= 0 ? speed : null,
        gpsQuality: accuracyToQuality(accuracy),
        isLocating: false,
        isResolvingCity: shouldResolveCity,
        permissionGranted: true,
        permissionDenied: false,
        error: null,
      }))

      if (!shouldResolveCity) {
        return
      }

      void resolveCityLabel(latitude, longitude).then((cityLabel) => {
        cityResolvedRef.current = true
        setState((prev) => ({
          ...prev,
          cityLabel,
          isResolvingCity: false,
        }))
      })
    },
    [snapshot, useRefPositionUpdates],
  )

  const subscribePosition = useCallback((listener: () => void) => {
    return positionListenersRef.current.subscribe(listener)
  }, [])

  const getGpsFix = useCallback((): RunWalkGpsFix | null => {
    return positionFixRef.current
  }, [])

  const applyHeading = useCallback(
    (heading: number) => {
      if (!Number.isFinite(heading) || heading < 0) return

      const normalized = heading % 360
      if (useRefPositionUpdates && positionFixRef.current) {
        positionFixRef.current = {
          ...positionFixRef.current,
          headingDegrees: normalized,
        }
        positionListenersRef.current.notify()
        return
      }

      setState((prev) => ({
        ...prev,
        headingDegrees: normalized,
      }))
    },
    [useRefPositionUpdates],
  )

  const applyPermissionState = useCallback((permission: AppLocationPermissionResponse) => {
    setState((prev) => ({
      ...prev,
      permissionGranted: permission.granted,
      permissionDenied: permission.status === 'denied',
      canAskAgain: permission.canAskAgain,
    }))
  }, [])

  const syncPermissionStatus = useCallback(async () => {
    const permission = await getForegroundPermissionsAsync()
    applyPermissionState(permission)
    return permission
  }, [applyPermissionState])

  const requestLocation = useCallback(async (): Promise<boolean> => {
    if (!enabled) return false

    setState((prev) => ({ ...prev, isLocating: true, error: null }))

    try {
      const permission = await requestForegroundPermissionsAsync()

      if (isAppLocationPermissionDenied(permission)) {
        setState((prev) => ({
          ...prev,
          isLocating: false,
          permissionGranted: false,
          permissionDenied: true,
          canAskAgain: permission.canAskAgain,
          error: permissionDeniedMessage(permission),
        }))
        return false
      }

      setState((prev) => ({
        ...prev,
        permissionGranted: permission.granted,
        permissionDenied: false,
        canAskAgain: permission.canAskAgain,
      }))

      await enableNetworkProviderAsync().catch(() => undefined)

      const initialAccuracy =
        trackingMode === 'activity' ? Accuracy.High : Accuracy.Balanced
      const watchAccuracy =
        trackingMode === 'activity' ? Accuracy.BestForNavigation : Accuracy.Balanced

      const position = await getCurrentPositionAsync({
        accuracy: initialAccuracy,
        mayShowUserSettingsDialog: trackingMode === 'activity',
      })

      applyPosition(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.accuracy ?? null,
        position.coords.heading ?? null,
        position.coords.speed ?? null,
      )

      if (snapshot) {
        stopWatch()
        return true
      }

      stopWatch()
      const watchOptions = TRACKING_WATCH_OPTIONS[trackingMode]
      watchRef.current = await watchPositionAsync(
        {
          accuracy: watchAccuracy,
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
      return true
    } catch (error) {
      const failureReason = getAppLocationFailureReason(error)
      if (failureReason === 'permission_denied') {
        setState((prev) => ({
          ...prev,
          isLocating: false,
          permissionGranted: false,
          permissionDenied: true,
          canAskAgain: false,
          error: permissionDeniedMessage({
            granted: false,
            status: 'denied',
            canAskAgain: false,
          }),
        }))
        return false
      }

      const fallback = address ? getHomeCoordinatesFromAddress(address) : null
      if (fallback) {
        const mock = getMockGpsCoordinates(fallback)
        applyPosition(mock.latitude, mock.longitude, 18, null, null)
        setState((prev) => ({
          ...prev,
          permissionGranted: true,
          error: 'Usando localização aproximada. Ative o GPS para maior precisão.',
        }))
        return true
      }

      setState((prev) => ({
        ...prev,
        isLocating: false,
        error: 'Não foi possível obter sua localização.',
      }))
      return false
    }
  }, [address, applyPosition, enabled, snapshot, stopWatch, trackingMode])

  useEffect(() => {
    if (!enabled) return

    if (autoRequest) {
      void requestLocation()
      return () => stopWatch()
    }

    let active = true

    void syncPermissionStatus().then((permission) => {
      if (!active || !permission.granted) return
      void requestLocation()
    })

    return () => {
      active = false
      stopWatch()
    }
  }, [autoRequest, enabled, requestLocation, stopWatch, syncPermissionStatus])

  useEffect(() => {
    if (!enabled || !trackHeading) {
      stopHeadingWatch()
      return
    }

    const headingSupport = getAppLocationHeadingSupport()
    if (!headingSupport.compass) {
      return
    }

    let active = true
    let lastAppliedAt = 0
    const headingThrottleMs = trackingMode === 'activity' ? 500 : 0

    void watchHeadingAsync((update) => {
      if (!active) return

      const now = Date.now()
      if (headingThrottleMs > 0 && now - lastAppliedAt < headingThrottleMs) return

      const heading = update.trueHeading >= 0 ? update.trueHeading : update.magHeading
      if (!Number.isFinite(heading) || heading < 0) return

      lastAppliedAt = now
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
  }, [applyHeading, enabled, stopHeadingWatch, trackHeading, trackingMode])

  return {
    ...state,
    refreshLocation: requestLocation,
    syncPermissionStatus,
    subscribePosition,
    getGpsFix,
  }
}

import type { AppLocationObject, AppLocationWatchOptions } from './appLocation.types'
import { AppLocationAccuracy } from './appLocation.types'

type PositionCallback = (location: AppLocationObject) => void
type PositionErrorHandler = (reason: string) => void

type GeoFix = {
  latitude: number
  longitude: number
}

type WebPositionWatcher = {
  remove: () => void
}

const MIN_COURSE_HEADING_SPEED_MPS = 0.7
const MIN_COURSE_HEADING_DISTANCE_METERS = 3
const MIN_STALE_POLL_MS = 8000

function haversineMeters(from: GeoFix, to: GeoFix): number {
  const earthRadius = 6371000
  const lat1 = (from.latitude * Math.PI) / 180
  const lat2 = (to.latitude * Math.PI) / 180
  const dLat = lat2 - lat1
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return 2 * earthRadius * Math.asin(Math.sqrt(a))
}

function computeBearingDegrees(from: GeoFix, to: GeoFix): number {
  const lat1 = (from.latitude * Math.PI) / 180
  const lat2 = (to.latitude * Math.PI) / 180
  const deltaLng = ((to.longitude - from.longitude) * Math.PI) / 180

  const y = Math.sin(deltaLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

const RELAXED_POLL_SETTINGS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15000,
  maximumAge: 30000,
}

function accuracySettings(accuracy?: AppLocationAccuracy): PositionOptions {
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

function enrichWithCourseHeading(
  location: AppLocationObject,
  previous: GeoFix | null,
): AppLocationObject {
  const currentHeading = location.coords.heading
  if (
    currentHeading != null &&
    Number.isFinite(currentHeading) &&
    currentHeading >= 0
  ) {
    return location
  }

  if (!previous) return location

  const moved = haversineMeters(previous, location.coords)
  if (moved < MIN_COURSE_HEADING_DISTANCE_METERS) return location

  const speed = location.coords.speed
  if (speed != null && Number.isFinite(speed) && speed >= 0 && speed < MIN_COURSE_HEADING_SPEED_MPS) {
    return location
  }

  return {
    ...location,
    coords: {
      ...location.coords,
      heading: computeBearingDegrees(previous, location.coords),
    },
  }
}

function shouldEmitUpdate(
  location: AppLocationObject,
  previousFix: GeoFix | null,
  lastEmittedAt: number,
  options: AppLocationWatchOptions,
): boolean {
  const now = Date.now()

  if (options.timeInterval && options.timeInterval > 0 && now - lastEmittedAt < options.timeInterval) {
    return false
  }

  if (
    options.distanceInterval &&
    options.distanceInterval > 0 &&
    previousFix &&
    haversineMeters(previousFix, location.coords) < options.distanceInterval
  ) {
    return false
  }

  return true
}

export function startWebPositionWatcher(
  options: AppLocationWatchOptions,
  callback: PositionCallback,
  _errorHandler?: PositionErrorHandler,
): WebPositionWatcher {
  const settings = accuracySettings(options.accuracy)
  let watchId: number | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let staleTimer: ReturnType<typeof setTimeout> | null = null
  let disposed = false
  let lastEmittedFix: GeoFix | null = null
  let lastRawFix: GeoFix | null = null
  let lastEmittedAt = 0
  let mode: 'watch' | 'poll' = 'watch'

  const clearStaleTimer = () => {
    if (staleTimer != null) {
      window.clearTimeout(staleTimer)
      staleTimer = null
    }
  }

  const scheduleStaleCheck = () => {
    clearStaleTimer()
    const staleMs = Math.max((options.timeInterval ?? 4000) * 2, MIN_STALE_POLL_MS)
    staleTimer = window.setTimeout(() => {
      if (!disposed) {
        void refreshPosition('stale')
      }
    }, staleMs)
  }

  const deliverPosition = (position: GeolocationPosition, force = false) => {
    if (disposed) return

    const enriched = enrichWithCourseHeading(toLocationObject(position), lastRawFix)
    lastRawFix = {
      latitude: enriched.coords.latitude,
      longitude: enriched.coords.longitude,
    }

    if (!force && !shouldEmitUpdate(enriched, lastEmittedFix, lastEmittedAt, options)) {
      scheduleStaleCheck()
      return
    }

    lastEmittedFix = {
      latitude: enriched.coords.latitude,
      longitude: enriched.coords.longitude,
    }
    lastEmittedAt = Date.now()
    callback(enriched)
    scheduleStaleCheck()
  }

  const refreshPosition = (reason: 'stale' | 'poll' | 'recover') => {
    if (disposed) return

    const requestSettings = reason === 'poll' || reason === 'recover' ? RELAXED_POLL_SETTINGS : settings

    navigator.geolocation.getCurrentPosition(
      (position) => deliverPosition(position, reason !== 'poll'),
      () => {
        // Falhas transitórias (ex.: kCLErrorLocationUnknown) são tratadas silenciosamente.
      },
      requestSettings,
    )
  }

  const startPollLoop = () => {
    if (pollTimer != null) return

    const pollMs = Math.max(options.timeInterval ?? 4000, 5000)
    pollTimer = window.setInterval(() => {
      refreshPosition('poll')
    }, pollMs)
  }

  const switchToPollMode = () => {
    if (mode === 'poll' || disposed) return

    mode = 'poll'
    if (watchId != null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
    startPollLoop()
    refreshPosition('recover')
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => deliverPosition(position),
    () => switchToPollMode(),
    settings,
  )

  scheduleStaleCheck()

  return {
    remove: () => {
      disposed = true
      clearStaleTimer()
      if (watchId != null) {
        navigator.geolocation.clearWatch(watchId)
        watchId = null
      }
      if (pollTimer != null) {
        window.clearInterval(pollTimer)
        pollTimer = null
      }
    },
  }
}

export type WebHeadingWatcher = {
  remove: () => void
  source: 'compass' | 'none'
}

type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>
}

export function isWebDeviceOrientationSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
}

async function requestDeviceOrientationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const OrientationEvent = DeviceOrientationEvent as DeviceOrientationEventWithPermission
  if (typeof OrientationEvent.requestPermission !== 'function') {
    return true
  }

  try {
    const state = await OrientationEvent.requestPermission()
    return state === 'granted'
  } catch {
    return false
  }
}

function normalizeCompassHeading(event: DeviceOrientationEvent): number | null {
  const webkitHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number })
    .webkitCompassHeading

  if (webkitHeading != null && Number.isFinite(webkitHeading) && webkitHeading >= 0) {
    return webkitHeading % 360
  }

  if (event.absolute && event.alpha != null && Number.isFinite(event.alpha)) {
    return (360 - event.alpha) % 360
  }

  return null
}

export async function startWebHeadingWatcher(
  callback: (heading: number) => void,
): Promise<WebHeadingWatcher> {
  if (!isWebDeviceOrientationSupported()) {
    return { remove: () => undefined, source: 'none' }
  }

  const permissionGranted = await requestDeviceOrientationPermission()
  if (!permissionGranted) {
    return { remove: () => undefined, source: 'none' }
  }

  let lastAppliedAt = 0
  const throttleMs = 250

  const handler = (event: DeviceOrientationEvent) => {
    const heading = normalizeCompassHeading(event)
    if (heading == null) return

    const now = Date.now()
    if (now - lastAppliedAt < throttleMs) return

    lastAppliedAt = now
    callback(heading)
  }

  window.addEventListener('deviceorientationabsolute', handler, true)
  window.addEventListener('deviceorientation', handler, true)

  return {
    source: 'compass',
    remove: () => {
      window.removeEventListener('deviceorientationabsolute', handler, true)
      window.removeEventListener('deviceorientation', handler, true)
    },
  }
}

export function isWebHeadingLikelyAvailable(): boolean {
  return isWebDeviceOrientationSupported()
}

import type { GeoCoordinates } from '../utils/geo'

export type RunWalkGpsFix = {
  coordinates: GeoCoordinates
  speedMps: number | null
  accuracyMeters: number | null
  headingDegrees: number | null
  recordedAt: number
}

export type RunWalkLiveGpsFeed = {
  subscribePosition: (listener: () => void) => () => void
  getGpsFix: () => RunWalkGpsFix | null
}

export type RunWalkLiveMapTrailFeed = {
  subscribeTrail: (listener: () => void) => () => void
  getTrail: () => GeoCoordinates[]
  getDisplaySpeedKmh: () => number
}

export function createListenerRegistry() {
  const listeners = new Set<() => void>()

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    notify() {
      listeners.forEach((listener) => listener())
    },
  }
}

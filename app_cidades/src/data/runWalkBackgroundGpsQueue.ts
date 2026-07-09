import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RunWalkGpsFix } from '../hooks/runWalkLiveGpsFeed'
import {
  normalizeLocationSpeedMps,
} from '../adapters/appLocation.types'

const QUEUE_KEY = '@telefarmed/run-walk/background-gps-queue'

export type RunWalkBackgroundGpsSample = {
  latitude: number
  longitude: number
  accuracyMeters: number | null
  speedMps: number | null
  recordedAt: number
}

function mapSampleToFix(sample: RunWalkBackgroundGpsSample): RunWalkGpsFix {
  return {
    coordinates: {
      latitude: sample.latitude,
      longitude: sample.longitude,
    },
    accuracyMeters: sample.accuracyMeters,
    speedMps: sample.speedMps,
    headingDegrees: null,
    recordedAt: sample.recordedAt,
  }
}

export async function enqueueRunWalkBackgroundGpsFixes(
  samples: RunWalkBackgroundGpsSample[],
): Promise<void> {
  if (samples.length === 0) return

  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  const existing = raw ? (JSON.parse(raw) as RunWalkBackgroundGpsSample[]) : []
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...existing, ...samples]))
}

export async function drainRunWalkBackgroundGpsFixes(): Promise<RunWalkGpsFix[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  if (!raw) return []

  await AsyncStorage.removeItem(QUEUE_KEY)

  try {
    const samples = JSON.parse(raw) as RunWalkBackgroundGpsSample[]
    return samples
      .filter(
        (sample) =>
          Number.isFinite(sample.latitude) &&
          Number.isFinite(sample.longitude) &&
          Number.isFinite(sample.recordedAt),
      )
      .sort((a, b) => a.recordedAt - b.recordedAt)
      .map(mapSampleToFix)
  } catch {
    return []
  }
}

export function mapLocationObjectToBackgroundSample(location: {
  coords: {
    latitude: number
    longitude: number
    accuracy: number | null
    speed: number | null
  }
  timestamp: number
}): RunWalkBackgroundGpsSample {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracyMeters: location.coords.accuracy,
    speedMps: normalizeLocationSpeedMps(location.coords.speed),
    recordedAt: location.timestamp,
  }
}

export function mapWebGeolocationToBackgroundSample(position: GeolocationPosition): RunWalkBackgroundGpsSample {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyMeters: position.coords.accuracy ?? null,
    speedMps: normalizeLocationSpeedMps(position.coords.speed),
    recordedAt: position.timestamp,
  }
}

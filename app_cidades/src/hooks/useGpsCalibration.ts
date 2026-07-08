import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import type { GeoCoordinates } from '../utils/geo'
import { haversineDistanceKm } from '../utils/geo'

export const GPS_CALIBRATION_ACCURACY_METERS = 25
export const GPS_CALIBRATION_HOLD_MS = 2_000
export const GPS_CALIBRATION_WEB_ACCURACY_METERS = 100
export const GPS_CALIBRATION_WEB_HOLD_MS = 500
/** ~4 m walk confirms GPS on browsers with loose accuracy reports. */
export const GPS_CALIBRATION_MOVEMENT_FALLBACK_METERS = 4
export const GPS_CALIBRATION_WEB_TIME_FALLBACK_MS = 2_500
export const GPS_CALIBRATION_NATIVE_TIME_FALLBACK_MS = 4_000

function resolveCalibrationAccuracyThreshold(): number {
  return Platform.OS === 'web'
    ? GPS_CALIBRATION_WEB_ACCURACY_METERS
    : GPS_CALIBRATION_ACCURACY_METERS
}

function resolveCalibrationHoldMs(): number {
  return Platform.OS === 'web' ? GPS_CALIBRATION_WEB_HOLD_MS : GPS_CALIBRATION_HOLD_MS
}

function resolveCalibrationTimeFallbackMs(): number {
  return Platform.OS === 'web'
    ? GPS_CALIBRATION_WEB_TIME_FALLBACK_MS
    : GPS_CALIBRATION_NATIVE_TIME_FALLBACK_MS
}

export type GpsCalibrationPhase = 'awaiting' | 'recording'

type UseGpsCalibrationOptions = {
  accuracyMeters: number | null
  coordinates: GeoCoordinates | null
  enabled?: boolean
  isPaused?: boolean
  initialPhase?: GpsCalibrationPhase
}

export function useGpsCalibration({
  accuracyMeters,
  coordinates,
  enabled = true,
  isPaused = false,
  initialPhase = 'awaiting',
}: UseGpsCalibrationOptions) {
  const [phase, setPhase] = useState<GpsCalibrationPhase>(initialPhase)
  const goodSinceRef = useRef<number | null>(null)
  const movementAnchorRef = useRef<GeoCoordinates | null>(null)
  const coordinatesSinceRef = useRef<number | null>(null)
  const accuracyThreshold = resolveCalibrationAccuracyThreshold()
  const holdMs = resolveCalibrationHoldMs()
  const timeFallbackMs = resolveCalibrationTimeFallbackMs()

  useEffect(() => {
    if (initialPhase === 'recording') {
      setPhase('recording')
    }
  }, [initialPhase])

  useEffect(() => {
    if (!enabled) {
      setPhase('awaiting')
      goodSinceRef.current = null
      movementAnchorRef.current = null
      coordinatesSinceRef.current = null
      return
    }

    if (isPaused || phase === 'recording') return

    if (!coordinates) {
      goodSinceRef.current = null
      movementAnchorRef.current = null
      coordinatesSinceRef.current = null
      return
    }

    const now = Date.now()
    if (coordinatesSinceRef.current == null) {
      coordinatesSinceRef.current = now
    } else if (now - coordinatesSinceRef.current >= timeFallbackMs) {
      setPhase('recording')
      return
    }

    if (movementAnchorRef.current == null) {
      movementAnchorRef.current = coordinates
    } else {
      const movedMeters =
        haversineDistanceKm(movementAnchorRef.current, coordinates) * 1000
      if (movedMeters >= GPS_CALIBRATION_MOVEMENT_FALLBACK_METERS) {
        setPhase('recording')
        return
      }
    }

    const accuracy = accuracyMeters ?? Number.POSITIVE_INFINITY
    if (accuracy > accuracyThreshold) {
      goodSinceRef.current = null
      return
    }

    if (goodSinceRef.current == null) {
      goodSinceRef.current = now
      return
    }

    if (now - goodSinceRef.current >= holdMs) {
      setPhase('recording')
    }
  }, [
    accuracyMeters,
    accuracyThreshold,
    coordinates,
    enabled,
    holdMs,
    isPaused,
    phase,
    timeFallbackMs,
  ])

  return {
    phase,
    isRecording: phase === 'recording',
    isCalibrating: phase === 'awaiting',
  }
}

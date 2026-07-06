import { useEffect, useRef, useState } from 'react'
import type { GeoCoordinates } from '../utils/geo'

export const GPS_CALIBRATION_ACCURACY_METERS = 25
export const GPS_CALIBRATION_HOLD_MS = 4_000

export type GpsCalibrationPhase = 'awaiting' | 'recording'

type UseGpsCalibrationOptions = {
  accuracyMeters: number | null
  coordinates: GeoCoordinates | null
  enabled?: boolean
  isPaused?: boolean
}

export function useGpsCalibration({
  accuracyMeters,
  coordinates,
  enabled = true,
  isPaused = false,
}: UseGpsCalibrationOptions) {
  const [phase, setPhase] = useState<GpsCalibrationPhase>('awaiting')
  const goodSinceRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      setPhase('awaiting')
      goodSinceRef.current = null
      return
    }

    if (isPaused || phase === 'recording') return

    if (!coordinates) {
      goodSinceRef.current = null
      return
    }

    const accuracy = accuracyMeters ?? Number.POSITIVE_INFINITY
    if (accuracy > GPS_CALIBRATION_ACCURACY_METERS) {
      goodSinceRef.current = null
      return
    }

    const now = Date.now()
    if (goodSinceRef.current == null) {
      goodSinceRef.current = now
      return
    }

    if (now - goodSinceRef.current >= GPS_CALIBRATION_HOLD_MS) {
      setPhase('recording')
    }
  }, [accuracyMeters, coordinates, enabled, isPaused, phase])

  return {
    phase,
    isRecording: phase === 'recording',
    isCalibrating: phase === 'awaiting',
  }
}

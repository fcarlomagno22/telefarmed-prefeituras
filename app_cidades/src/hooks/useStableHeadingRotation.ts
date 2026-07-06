import { useEffect, useRef, useState } from 'react'

const STABLE_SPEED_KMH = 2.5
const STABLE_HEADING_HOLD_MS = 5_000

export function useStableHeadingRotation(speedKmh: number, gpsRecording: boolean) {
  const [enabled, setEnabled] = useState(false)
  const stableSinceRef = useRef<number | null>(null)

  useEffect(() => {
    if (!gpsRecording) {
      stableSinceRef.current = null
      setEnabled(false)
      return
    }

    if (speedKmh < STABLE_SPEED_KMH) {
      stableSinceRef.current = null
      setEnabled(false)
      return
    }

    const now = Date.now()
    if (stableSinceRef.current == null) {
      stableSinceRef.current = now
      return
    }

    if (now - stableSinceRef.current >= STABLE_HEADING_HOLD_MS) {
      setEnabled(true)
    }
  }, [gpsRecording, speedKmh])

  return enabled
}

import { haversineDistanceKm } from './geo'
import { clampActivitySpeedKmh, mpsToKmh } from './runWalkActivityStats'

export type DisplaySpeedSample = {
  latitude: number
  longitude: number
  speedMps: number | null
  recordedAt: number
}

const DISPLAY_SPEED_WINDOW_MS = 3_000
const DISPLAY_SPEED_MIN_ELAPSED_MS = 200
const DISPLAY_SPEED_EMA_ALPHA = 0.55
const MIN_DISTANCE_FOR_DISPLAY_METERS = 1.5
const MIN_PAIR_DISTANCE_FOR_DISPLAY_METERS = 0.35
const MIN_GPS_SPEED_MPS = 0.2

/**
 * Instant speed for live UI — raw GPS only, independent of GpsMotionEngine/ZUPT.
 */
export class RunWalkDisplaySpeedTracker {
  private samples: DisplaySpeedSample[] = []
  private smoothedKmh = 0

  reset(): void {
    this.samples = []
    this.smoothedKmh = 0
  }

  ingest(sample: DisplaySpeedSample): number {
    this.samples.push(sample)
    this.prune(sample.recordedAt)

    const rawKmh = this.resolveRawSpeedKmh()
    if (rawKmh == null) {
      return Math.max(0, this.smoothedKmh)
    }

    if (this.smoothedKmh <= 0) {
      this.smoothedKmh = rawKmh
    } else {
      this.smoothedKmh =
        DISPLAY_SPEED_EMA_ALPHA * rawKmh + (1 - DISPLAY_SPEED_EMA_ALPHA) * this.smoothedKmh
    }

    return Math.max(0, this.smoothedKmh)
  }

  private prune(now: number): void {
    const cutoff = now - DISPLAY_SPEED_WINDOW_MS
    while (this.samples.length > 0 && this.samples[0].recordedAt < cutoff) {
      this.samples.shift()
    }
  }

  private resolveRawSpeedKmh(): number | null {
    if (this.samples.length === 0) return null

    const latest = this.samples[this.samples.length - 1]
    const gpsKmh = clampActivitySpeedKmh(mpsToKmh(latest.speedMps))
    if (
      gpsKmh != null &&
      latest.speedMps != null &&
      Number.isFinite(latest.speedMps) &&
      latest.speedMps >= MIN_GPS_SPEED_MPS
    ) {
      return gpsKmh
    }

    if (this.samples.length >= 2) {
      const previous = this.samples[this.samples.length - 2]
      const pairElapsedMs = latest.recordedAt - previous.recordedAt
      if (pairElapsedMs >= DISPLAY_SPEED_MIN_ELAPSED_MS) {
        const pairDistanceMeters = haversineDistanceKm(previous, latest) * 1000
        if (pairDistanceMeters >= MIN_PAIR_DISTANCE_FOR_DISPLAY_METERS) {
          const pairSpeedKmh = (pairDistanceMeters / 1000) / (pairElapsedMs / 3_600_000)
          const clampedPair = clampActivitySpeedKmh(pairSpeedKmh)
          if (clampedPair != null) return clampedPair
        }
      }
    }

    if (this.samples.length < 2) return gpsKmh

    const oldest = this.samples[0]
    const elapsedMs = latest.recordedAt - oldest.recordedAt
    if (elapsedMs < DISPLAY_SPEED_MIN_ELAPSED_MS) return gpsKmh

    const distanceMeters = haversineDistanceKm(oldest, latest) * 1000
    if (distanceMeters < MIN_DISTANCE_FOR_DISPLAY_METERS) return gpsKmh

    const speedKmh = (distanceMeters / 1000) / (elapsedMs / 3_600_000)
    return clampActivitySpeedKmh(speedKmh) ?? gpsKmh
  }
}

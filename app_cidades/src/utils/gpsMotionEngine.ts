import type { GeoCoordinates } from './geo'
import { haversineDistanceKm } from './geo'
import type { ActivityTrailPoint } from './runWalkActivityStats'

/**
 * Waze-style GPS motion model:
 * - Speed from GPS Doppler (Location.speed) smoothed with EMA
 * - Stationary when speed stays below threshold for a hold period (ZUPT)
 * - Distance only accumulates while confirmed moving
 * - Average speed = distance / moving time (not wall-clock time)
 */
export type GpsMotionSample = {
  latitude: number
  longitude: number
  accuracyMeters: number | null
  speedMps: number | null
  recordedAt: number
}

export type GpsMotionState = 'stationary' | 'moving'

export type GpsMotionSnapshot = {
  state: GpsMotionState
  trail: ActivityTrailPoint[]
  distanceKm: number
  currentSpeedKmh: number
  averageSpeedKmh: number
  displayPosition: GeoCoordinates | null
  movingTimeSeconds: number
}

// ~1.8 km/h — Waze treats this as stopped
const STATIONARY_SPEED_MPS = 0.5
// ~2.9 km/h — need sustained speed above this to leave stationary
const MOVING_SPEED_MPS = 0.8
// Confirm stop after low speed for this long (like Waze traffic-light hold)
const STATIONARY_HOLD_MS = 2_000
const MOVING_CONFIRM_MS = 1_500
const SPEED_EMA_ALPHA = 0.35
const MIN_TRAIL_SEGMENT_METERS = 8

export class GpsMotionEngine {
  private trail: ActivityTrailPoint[] = []
  private state: GpsMotionState = 'stationary'
  private anchor: GeoCoordinates | null = null
  private smoothedSpeedMps = 0
  private belowThresholdSince: number | null = null
  private aboveThresholdSince: number | null = null
  private movingTimeMs = 0
  private distanceKm = 0
  private hasEverMoved = false
  private lastSample: GpsMotionSample | null = null
  private lastMovingTickAt: number | null = null

  reset(): void {
    this.trail = []
    this.state = 'stationary'
    this.anchor = null
    this.smoothedSpeedMps = 0
    this.belowThresholdSince = null
    this.aboveThresholdSince = null
    this.movingTimeMs = 0
    this.distanceKm = 0
    this.hasEverMoved = false
    this.lastSample = null
    this.lastMovingTickAt = null
  }

  ingest(sample: GpsMotionSample): GpsMotionSnapshot {
    const rawSpeedMps = this.resolveRawSpeedMps(sample)
    this.smoothedSpeedMps = this.smoothSpeed(rawSpeedMps)
    this.updateMotionState(sample)
    this.seedTrailIfNeeded(sample)
    this.maybeAppendTrailPoint(sample)
    this.lastSample = sample

    return this.getSnapshot(sample)
  }

  getSnapshot(sample?: GpsMotionSample | null): GpsMotionSnapshot {
    const displayPosition = sample
      ? { latitude: sample.latitude, longitude: sample.longitude }
      : this.lastSample
        ? { latitude: this.lastSample.latitude, longitude: this.lastSample.longitude }
        : this.trail[this.trail.length - 1] ?? null

    const movingTimeSeconds = this.movingTimeMs / 1000
    const currentSpeedKmh =
      this.state === 'stationary' ? 0 : Math.max(0, this.smoothedSpeedMps * 3.6)

    let averageSpeedKmh = 0
    if (this.state === 'moving' && movingTimeSeconds >= 3 && this.distanceKm > 0) {
      averageSpeedKmh = this.distanceKm / (movingTimeSeconds / 3600)
    } else if (this.hasEverMoved && movingTimeSeconds >= 3 && this.distanceKm > 0) {
      averageSpeedKmh = this.distanceKm / (movingTimeSeconds / 3600)
    }

    return {
      state: this.state,
      trail: [...this.trail],
      distanceKm: this.distanceKm,
      currentSpeedKmh,
      averageSpeedKmh,
      displayPosition,
      movingTimeSeconds,
    }
  }

  private resolveRawSpeedMps(sample: GpsMotionSample): number {
    if (sample.speedMps != null && Number.isFinite(sample.speedMps) && sample.speedMps >= 0) {
      return sample.speedMps
    }

    if (!this.lastSample) return 0

    const elapsedMs = sample.recordedAt - this.lastSample.recordedAt
    if (elapsedMs < 500 || elapsedMs > 30_000) return 0

    const distanceMeters =
      haversineDistanceKm(
        { latitude: this.lastSample.latitude, longitude: this.lastSample.longitude },
        { latitude: sample.latitude, longitude: sample.longitude },
      ) * 1000

    return distanceMeters / (elapsedMs / 1000)
  }

  private smoothSpeed(rawSpeedMps: number): number {
    if (this.lastSample == null) return rawSpeedMps
    return SPEED_EMA_ALPHA * rawSpeedMps + (1 - SPEED_EMA_ALPHA) * this.smoothedSpeedMps
  }

  private updateMotionState(sample: GpsMotionSample): void {
    const now = sample.recordedAt
    const speed = this.smoothedSpeedMps
    const accuracy = sample.accuracyMeters ?? 20
    const driftFromAnchorMeters = this.anchor
      ? haversineDistanceKm(this.anchor, sample) * 1000
      : 0

    if (speed < STATIONARY_SPEED_MPS && driftFromAnchorMeters < Math.max(accuracy, 12)) {
      this.aboveThresholdSince = null

      if (this.belowThresholdSince == null) {
        this.belowThresholdSince = now
      }

      const holdMs = this.hasEverMoved ? STATIONARY_HOLD_MS : 800
      if (now - this.belowThresholdSince >= holdMs) {
        this.enterStationary(sample)
      }
      return
    }

    if (speed >= MOVING_SPEED_MPS && driftFromAnchorMeters >= Math.max(accuracy * 1.2, 15)) {
      this.belowThresholdSince = null

      if (this.aboveThresholdSince == null) {
        this.aboveThresholdSince = now
      }

      if (now - this.aboveThresholdSince >= MOVING_CONFIRM_MS) {
        this.enterMoving(now)
      }
      return
    }

    this.belowThresholdSince = null
    this.aboveThresholdSince = null
  }

  private enterStationary(sample: GpsMotionSample): void {
    if (this.state === 'stationary' && this.smoothedSpeedMps === 0) return

    this.state = 'stationary'
    this.smoothedSpeedMps = 0
    this.aboveThresholdSince = null
    this.lastMovingTickAt = null

    if (!this.hasEverMoved && this.trail.length > 1) {
      const anchor = this.trail[0]
      this.trail = [{ ...anchor, recordedAt: sample.recordedAt }]
      this.anchor = anchor
      this.distanceKm = 0
    }
  }

  private enterMoving(now: number): void {
    if (this.state === 'moving') {
      this.tickMovingTime(now)
      return
    }

    this.state = 'moving'
    this.hasEverMoved = true
    this.lastMovingTickAt = now
  }

  private tickMovingTime(now: number): void {
    if (this.state !== 'moving') return

    if (this.lastMovingTickAt != null && now > this.lastMovingTickAt) {
      this.movingTimeMs += now - this.lastMovingTickAt
    }

    this.lastMovingTickAt = now
  }

  private seedTrailIfNeeded(sample: GpsMotionSample): void {
    if (this.trail.length > 0) return

    const point: ActivityTrailPoint = {
      latitude: sample.latitude,
      longitude: sample.longitude,
      recordedAt: sample.recordedAt,
    }

    this.trail = [point]
    this.anchor = point
  }

  private maybeAppendTrailPoint(sample: GpsMotionSample): void {
    if (this.state !== 'moving') return

    this.tickMovingTime(sample.recordedAt)

    const last = this.trail[this.trail.length - 1]
    if (!last) return

    const next: ActivityTrailPoint = {
      latitude: sample.latitude,
      longitude: sample.longitude,
      recordedAt: sample.recordedAt,
    }

    const deltaMeters = haversineDistanceKm(last, next) * 1000
    const accuracy = sample.accuracyMeters ?? 20
    const minSegmentMeters = Math.max(MIN_TRAIL_SEGMENT_METERS, accuracy * 0.65)

    if (deltaMeters < minSegmentMeters) return

    this.trail.push(next)
    this.distanceKm += deltaMeters / 1000
  }
}

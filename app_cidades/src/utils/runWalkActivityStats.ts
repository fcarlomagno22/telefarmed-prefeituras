import type { ActivityModality } from '../types/auth'
import type { RunWalkActivityStep } from '../types/runWalk'
import type { GeoCoordinates } from './geo'
import { haversineDistanceKm } from './geo'

export type ActivityPrimaryMetric = 'pace' | 'speed'

export type ActivityTrailPoint = GeoCoordinates & {
  recordedAt: number
}

const STEPS_PER_KM: Record<string, number> = {
  walk: 1300,
  'active-walk': 1350,
  run: 1550,
  'run-walk': 1420,
  treadmill: 1500,
  free: 1350,
}

const FALLBACK_PACE_MIN_PER_KM: Record<string, number> = {
  walk: 11 + 20 / 60,
  'active-walk': 10 + 30 / 60,
  run: 6 + 24 / 60,
  'run-walk': 8 + 15 / 60,
  treadmill: 7 + 30 / 60,
  free: 10,
}

export function formatElapsedActivityTimeParts(totalSeconds: number): ActivityMetricParts {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60

  if (hours > 0) {
    return {
      value: `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    }
  }

  if (seconds === 0) {
    return { value: String(minutes), unit: 'min' }
  }

  return {
    value: `${minutes}:${String(seconds).padStart(2, '0')}`,
    unit: 'min',
  }
}

export function formatElapsedActivityTime(totalSeconds: number): string {
  const parts = formatElapsedActivityTimeParts(totalSeconds)
  if (!parts.unit) return parts.value
  return `${parts.value} ${parts.unit}`
}

export function formatClockTime(date = new Date()): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatPaceMinPerKmParts(minPerKm: number | null): ActivityMetricParts {
  if (minPerKm == null || !Number.isFinite(minPerKm) || minPerKm <= 0) {
    return { value: '—' }
  }

  const totalSeconds = Math.round(minPerKm * 60)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return {
    value: String(minutes),
    unit: `m${String(seconds).padStart(2, '0')}s/km`,
    tightUnit: true,
  }
}

export function formatPaceMinPerKm(minPerKm: number | null): string {
  const parts = formatPaceMinPerKmParts(minPerKm)
  if (!parts.unit) return parts.value
  return `${parts.value}${parts.unit}`
}

export function formatSpeedKmh(speedKmh: number | null): string {
  const parts = formatSpeedKmhParts(speedKmh)
  if (!parts.unit) return parts.value
  return `${parts.value} ${parts.unit}`
}

export type ActivityMetricParts = {
  value: string
  unit?: string
  tightUnit?: boolean
}

export function formatSpeedKmhParts(speedKmh: number | null): ActivityMetricParts {
  if (speedKmh == null || !Number.isFinite(speedKmh)) {
    return { value: '—' }
  }

  if (speedKmh <= 0) {
    return { value: '0,0', unit: 'km/h' }
  }

  return {
    value: speedKmh.toFixed(1).replace('.', ','),
    unit: 'km/h',
  }
}

export function formatActivityDistanceKm(distanceKm: number): string {
  const parts = formatActivityDistanceKmParts(distanceKm)
  if (!parts.unit) return parts.value
  return `${parts.value} ${parts.unit}`
}

export function formatActivityDistanceKmParts(distanceKm: number): ActivityMetricParts {
  if (distanceKm < 0.01) return { value: '0,00', unit: 'km' }
  if (distanceKm < 1) {
    return { value: String(Math.round(distanceKm * 1000)), unit: 'm' }
  }

  return {
    value: distanceKm.toFixed(2).replace('.', ','),
    unit: 'km',
  }
}

export function formatStepCount(steps: number): string {
  return steps.toLocaleString('pt-BR')
}

export function formatHeartRate(bpm: number | null): string {
  if (bpm == null || !Number.isFinite(bpm) || bpm <= 0) return '—'
  return `${Math.round(bpm)}`
}

export function getDefaultActivitySteps(
  modality: ActivityModality,
  durationMinutes: number,
): RunWalkActivityStep[] {
  const mainMinutes = Math.max(5, durationMinutes - 10)

  switch (modality) {
    case 'run':
      return [
        { label: '5 min aquecimento' },
        { label: `${mainMinutes} min corrida` },
        { label: '5 min desaceleração' },
      ]
    case 'run-walk':
      return [
        { label: '5 min caminhada' },
        { label: `${mainMinutes} min alternando corrida e caminhada` },
        { label: '5 min desaceleração' },
      ]
    case 'treadmill':
      return [
        { label: '3 min aquecimento na esteira' },
        { label: `${Math.max(5, durationMinutes - 6)} min na intensidade planejada` },
        { label: '3 min desaceleração' },
      ]
    default:
      return [
        { label: '5 min aquecimento' },
        { label: `${mainMinutes} min caminhada` },
        { label: '5 min desaceleração' },
      ]
  }
}

export function resolveCurrentActivityStep(
  steps: RunWalkActivityStep[],
  elapsedSeconds: number,
  totalDurationMinutes: number,
): { index: number; label: string } {
  if (steps.length === 0) {
    return { index: 0, label: 'Atividade em andamento' }
  }

  const totalDurationSec = Math.max(60, totalDurationMinutes * 60)
  const progress = Math.min(1, elapsedSeconds / totalDurationSec)
  const index = Math.min(steps.length - 1, Math.floor(progress * steps.length))

  return {
    index,
    label: steps[index]?.label ?? 'Atividade em andamento',
  }
}

export function estimateStepsFromDistance(distanceKm: number, modality: ActivityModality): number {
  const ratio = STEPS_PER_KM[modality] ?? STEPS_PER_KM.free
  return Math.round(distanceKm * ratio)
}

export function estimateHeartRateBpm(
  modality: ActivityModality,
  elapsedSeconds: number,
): number {
  const baseByModality: Record<string, number> = {
    walk: 98,
    'active-walk': 108,
    run: 142,
    'run-walk': 124,
    treadmill: 130,
    free: 112,
  }

  const peakByModality: Record<string, number> = {
    walk: 112,
    'active-walk': 124,
    run: 168,
    'run-walk': 148,
    treadmill: 156,
    free: 132,
  }

  const base = baseByModality[modality] ?? 105
  const peak = peakByModality[modality] ?? 125
  const ramp = Math.min(1, elapsedSeconds / (8 * 60))
  const wave = Math.sin(elapsedSeconds / 18) * 3

  return Math.round(base + (peak - base) * ramp + wave)
}

export function getFallbackPaceMinPerKm(modality: ActivityModality): number {
  return FALLBACK_PACE_MIN_PER_KM[modality] ?? FALLBACK_PACE_MIN_PER_KM.free
}

export function speedKmhToPaceMinPerKm(speedKmh: number): number | null {
  if (!Number.isFinite(speedKmh) || speedKmh <= 0) return null
  return 60 / speedKmh
}

export function paceMinPerKmToSpeedKmh(minPerKm: number): number | null {
  if (!Number.isFinite(minPerKm) || minPerKm <= 0) return null
  return 60 / minPerKm
}

export function calculateRollingPaceAndSpeed(
  trail: ActivityTrailPoint[],
  windowMs = 12_000,
): { paceMinPerKm: number | null; speedKmh: number | null } {
  if (trail.length < 2) {
    return { paceMinPerKm: null, speedKmh: null }
  }

  const latest = trail[trail.length - 1]
  const cutoff = latest.recordedAt - windowMs
  const recent = trail.filter((point) => point.recordedAt >= cutoff)

  if (recent.length < 2) {
    return { paceMinPerKm: null, speedKmh: null }
  }

  let distanceKm = 0
  for (let index = 1; index < recent.length; index += 1) {
    distanceKm += haversineDistanceKm(recent[index - 1], recent[index])
  }

  const elapsedMs = recent[recent.length - 1].recordedAt - recent[0].recordedAt
  if (elapsedMs <= 0 || distanceKm * 1000 < 8) {
    return { paceMinPerKm: null, speedKmh: null }
  }

  const speedKmh = distanceKm / (elapsedMs / (1000 * 60 * 60))
  const paceMinPerKm = speedKmhToPaceMinPerKm(speedKmh)

  return { paceMinPerKm, speedKmh }
}

export function calculateAverageSpeedKmh(
  distanceKm: number,
  elapsedSeconds: number,
  minDistanceMeters = MIN_DISTANCE_FOR_SPEED_METERS,
): number | null {
  if (elapsedSeconds <= 0 || distanceKm <= 0) return null
  if (distanceKm * 1000 < minDistanceMeters) return null
  return distanceKm / (elapsedSeconds / 3600)
}

export function calculateAveragePaceMinPerKm(
  distanceKm: number,
  elapsedSeconds: number,
): number | null {
  const speed = calculateAverageSpeedKmh(distanceKm, elapsedSeconds)
  return speed != null ? speedKmhToPaceMinPerKm(speed) : null
}

export function mpsToKmh(speedMps: number | null | undefined): number | null {
  if (speedMps == null || !Number.isFinite(speedMps) || speedMps < 0) return null
  return speedMps * 3.6
}

export function clampActivitySpeedKmh(speedKmh: number | null): number | null {
  if (speedKmh == null || !Number.isFinite(speedKmh) || speedKmh <= 0) return null
  return Math.min(speedKmh, 120)
}

export function calculateInstantSpeedKmh(
  trail: ActivityTrailPoint[],
  gpsSpeedMps: number | null | undefined,
  windowMs = 12_000,
): number | null {
  const rollingSpeed = clampActivitySpeedKmh(
    calculateRollingPaceAndSpeed(trail, windowMs).speedKmh,
  )

  if (rollingSpeed != null) {
    return rollingSpeed
  }

  const gpsSpeed = clampActivitySpeedKmh(mpsToKmh(gpsSpeedMps))
  if (gpsSpeedMps != null && gpsSpeedMps >= 0.5 && gpsSpeed != null) {
    return gpsSpeed
  }

  return null
}

const CALORIES_MET_BY_MODALITY: Record<string, number> = {
  walk: 3.5,
  'active-walk': 4.5,
  run: 9,
  'run-walk': 6.5,
  treadmill: 7,
  free: 4,
}

export function estimateCaloriesBurned(
  modality: ActivityModality,
  elapsedSeconds: number,
  weightKg = 70,
): number {
  if (elapsedSeconds <= 0) return 0

  const met = CALORIES_MET_BY_MODALITY[modality] ?? CALORIES_MET_BY_MODALITY.free
  const hours = elapsedSeconds / 3600
  return Math.max(1, Math.round(met * weightKg * hours))
}

export function formatCaloriesBurned(calories: number): string {
  return `${calories.toLocaleString('pt-BR')} kcal`
}

const MIN_TRAIL_SEGMENT_METERS = 8
const MIN_DISTANCE_FOR_SPEED_METERS = 20
const STATIONARY_GPS_SPEED_MPS = 0.6

export type TrailPointFilterOptions = {
  minDistanceMeters?: number
  accuracyMeters?: number | null
  gpsSpeedMps?: number | null
}

export function resolveMinTrailDistanceMeters(
  accuracyMeters?: number | null,
  minDistanceMeters = MIN_TRAIL_SEGMENT_METERS,
): number {
  const accuracy = accuracyMeters ?? 20
  return Math.max(minDistanceMeters, Math.min(accuracy * 0.75, 25))
}

export function isStationaryGpsReading(gpsSpeedMps?: number | null): boolean {
  return gpsSpeedMps == null || !Number.isFinite(gpsSpeedMps) || gpsSpeedMps < STATIONARY_GPS_SPEED_MPS
}

export function calculateTotalDistanceKm(trail: ActivityTrailPoint[]): number {
  if (trail.length < 2) return 0

  let totalKm = 0
  for (let index = 1; index < trail.length; index += 1) {
    totalKm += haversineDistanceKm(trail[index - 1], trail[index])
  }

  return totalKm
}

export function shouldAppendTrailPoint(
  trail: ActivityTrailPoint[],
  next: GeoCoordinates,
  options: number | TrailPointFilterOptions = MIN_TRAIL_SEGMENT_METERS,
): boolean {
  const resolvedOptions: TrailPointFilterOptions =
    typeof options === 'number' ? { minDistanceMeters: options } : options

  const last = trail[trail.length - 1]
  if (!last) return true

  const deltaMeters = haversineDistanceKm(last, next) * 1000
  const minDistanceMeters = resolveMinTrailDistanceMeters(
    resolvedOptions.accuracyMeters,
    resolvedOptions.minDistanceMeters,
  )

  if (deltaMeters < minDistanceMeters) {
    return false
  }

  if (isStationaryGpsReading(resolvedOptions.gpsSpeedMps)) {
    return deltaMeters >= Math.max(minDistanceMeters, 12)
  }

  return true
}

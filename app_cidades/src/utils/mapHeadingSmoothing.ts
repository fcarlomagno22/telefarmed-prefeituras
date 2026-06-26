import { computeTrailHeadingDegrees, type GeoCoordinates } from './geo'

const MIN_SPEED_KMH_FOR_COURSE = 2.5
const MIN_BEARING_DELTA_DEG = 4
const MAX_BEARING_STEP_DEG = 10

function normalizeHeading(heading: number): number {
  return ((heading % 360) + 360) % 360
}

function shortestHeadingDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180
}

export function resolveLiveMapHeading(
  trail: GeoCoordinates[],
  deviceHeadingDegrees: number | null | undefined,
  lastHeadingDegrees: number | null,
  speedKmh: number,
): number | null {
  const courseHeading = computeTrailHeadingDegrees(trail)

  if (courseHeading != null && speedKmh >= MIN_SPEED_KMH_FOR_COURSE) {
    return courseHeading
  }

  if (lastHeadingDegrees != null) {
    return lastHeadingDegrees
  }

  if (
    deviceHeadingDegrees != null &&
    Number.isFinite(deviceHeadingDegrees) &&
    deviceHeadingDegrees >= 0
  ) {
    return normalizeHeading(deviceHeadingDegrees)
  }

  return courseHeading
}

export function smoothMapHeading(
  currentHeading: number | null,
  targetHeading: number | null,
): number | null {
  if (targetHeading == null) return currentHeading
  const normalizedTarget = normalizeHeading(targetHeading)

  if (currentHeading == null) return normalizedTarget

  const delta = shortestHeadingDelta(currentHeading, normalizedTarget)
  if (Math.abs(delta) < MIN_BEARING_DELTA_DEG) {
    return currentHeading
  }

  const step = Math.sign(delta) * Math.min(Math.abs(delta), MAX_BEARING_STEP_DEG)
  return normalizeHeading(currentHeading + step)
}

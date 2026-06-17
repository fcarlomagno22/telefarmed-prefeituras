export type GeoCoordinates = {
  latitude: number
  longitude: number
}

const EARTH_RADIUS_KM = 6371

export function haversineDistanceKm(from: GeoCoordinates, to: GeoCoordinates): number {
  const toRadians = (value: number) => (value * Math.PI) / 180
  const deltaLat = toRadians(to.latitude - from.latitude)
  const deltaLng = toRadians(to.longitude - from.longitude)
  const lat1 = toRadians(from.latitude)
  const lat2 = toRadians(to.latitude)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

export function computeBearingDegrees(from: GeoCoordinates, to: GeoCoordinates): number {
  const toRadians = (value: number) => (value * Math.PI) / 180
  const lat1 = toRadians(from.latitude)
  const lat2 = toRadians(to.latitude)
  const deltaLng = toRadians(to.longitude - from.longitude)

  const y = Math.sin(deltaLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)
  const bearing = (Math.atan2(y, x) * 180) / Math.PI

  return (bearing + 360) % 360
}

export function computeTrailHeadingDegrees(trail: GeoCoordinates[]): number | null {
  if (trail.length < 2) return null

  for (let index = trail.length - 1; index >= 1; index -= 1) {
    const from = trail[index - 1]
    const to = trail[index]
    if (haversineDistanceKm(from, to) * 1000 >= 2) {
      return computeBearingDegrees(from, to)
    }
  }

  return computeBearingDegrees(trail[trail.length - 2], trail[trail.length - 1])
}

export function resolveMapMarkerHeading(
  trail: GeoCoordinates[],
  deviceHeadingDegrees: number | null | undefined,
  lastHeadingDegrees: number | null,
): number | null {
  if (
    deviceHeadingDegrees != null &&
    Number.isFinite(deviceHeadingDegrees) &&
    deviceHeadingDegrees >= 0
  ) {
    return deviceHeadingDegrees % 360
  }

  const movementHeading = computeTrailHeadingDegrees(trail)
  if (movementHeading != null) return movementHeading
  if (lastHeadingDegrees != null) return lastHeadingDegrees

  return trail.length > 0 ? 0 : null
}

export function formatDistanceKm(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.max(1, Math.round(distanceKm * 1000))} m`
  }

  return `${distanceKm.toFixed(1).replace('.', ',')} km`
}

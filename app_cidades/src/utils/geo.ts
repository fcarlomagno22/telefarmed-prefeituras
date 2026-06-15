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

export function formatDistanceKm(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.max(1, Math.round(distanceKm * 1000))} m`
  }

  return `${distanceKm.toFixed(1).replace('.', ',')} km`
}

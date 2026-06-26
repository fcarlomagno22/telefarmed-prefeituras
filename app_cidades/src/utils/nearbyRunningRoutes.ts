import { listRunningRouteSpots } from '../data/runningRouteSpotsService'
import type {
  RunningRouteSpot,
  RunningRouteSpotRecord,
  RunningRouteSpotType,
} from '../types/nearbyRunningRoutes'
import { formatDistanceKm, GeoCoordinates, haversineDistanceKm } from './geo'

export function getRunningRouteSpotTypeLabel(type: RunningRouteSpotType) {
  if (type === 'park') return 'Parque'
  if (type === 'track') return 'Pista de cooper'
  if (type === 'waterfront') return 'Orla / margem'
  if (type === 'trail') return 'Trilha urbana'
  return 'Praça / área aberta'
}

export const RUNNING_ROUTE_SPOT_TYPE_OPTIONS: {
  id: RunningRouteSpotType
  label: string
}[] = [
  { id: 'park', label: 'Parque' },
  { id: 'track', label: 'Pista de cooper' },
  { id: 'waterfront', label: 'Orla / margem' },
  { id: 'trail', label: 'Trilha urbana' },
  { id: 'plaza', label: 'Praça / área aberta' },
]

function estimateWalkMinutes(distanceKm: number) {
  return Math.max(1, Math.round((distanceKm / 5) * 60))
}

function toNearbySpot(record: RunningRouteSpotRecord, origin: GeoCoordinates): RunningRouteSpot {
  const distanceKm = haversineDistanceKm(origin, {
    latitude: record.latitude,
    longitude: record.longitude,
  })

  return {
    ...record,
    distanceKm,
    walkMinutes: estimateWalkMinutes(distanceKm),
  }
}

export function formatRunningRouteSpotMeta(spot: RunningRouteSpot) {
  return `${formatDistanceKm(spot.distanceKm)} · ~${spot.walkMinutes} min a pé`
}

export function formatRunningRouteSpotAddress(spot: RunningRouteSpot) {
  return spot.addressLabel?.trim() || 'Endereço não informado'
}

export async function fetchNearbyRunningRoutes(origin: GeoCoordinates): Promise<RunningRouteSpot[]> {
  const records = await listRunningRouteSpots()
  return records
    .map((record) => toNearbySpot(record, origin))
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

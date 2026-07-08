import {
  resolveRunWalkLocalCoverPublicUrl,
  toStoredRunWalkLocalCoverReference,
} from '../../lib/runWalkLocalCover.js'
import { VdRunWalkError } from './errors.js'
import type { RunningRouteSpotType, RunningRouteLocationSource } from './types.js'

export const DEFAULT_LOCAIS_RADIUS_KM = 50
export const MAX_LOCAIS_RADIUS_KM = 150
export const DEFAULT_LOCAIS_PAGE_SIZE = 50
export const MAX_LOCAIS_PAGE_SIZE = 100

export type RunningRouteSpotRow = {
  id: string
  name: string
  description: string
  type: RunningRouteSpotType
  latitude: number
  longitude: number
  address_label: string | null
  location_source: RunningRouteLocationSource
  cover_photo_url: string | null
  submitted_by_cpf: string | null
  submitted_by_name: string | null
  recommend_count: number
  not_recommend_count: number
  entidade_contratante_id: string | null
  paciente_id: string | null
  created_at: string
}

export type RunningRouteLocalDto = {
  id: string
  name: string
  description: string
  type: RunningRouteSpotType
  latitude: number
  longitude: number
  addressLabel: string | null
  locationSource: RunningRouteLocationSource
  coverPhotoUrl: string | null
  submittedByCpf: string | null
  submittedByName: string | null
  recommendCount: number
  notRecommendCount: number
  distanceKm: number
  createdAt: string
}

export type RunningRouteLocaisListDto = {
  spots: RunningRouteLocalDto[]
  totalCount: number
  hasMore: boolean
  page: number
  pageSize: number
}

export type ListRunningRouteLocaisQuery = {
  latitude: number
  longitude: number
  radiusKm?: number
  page?: number
  pageSize?: number
}

export type CreateRunningRouteLocalInput = {
  name: string
  description?: string
  type: RunningRouteSpotType
  latitude: number
  longitude: number
  addressLabel: string
  locationSource: RunningRouteLocationSource
  coverPhotoStoragePath?: string | null
  coverPhotoUrl?: string | null
}

const EARTH_RADIUS_KM = 6371

export function haversineDistanceKm(
  origin: { latitude: number; longitude: number },
  target: { latitude: number; longitude: number },
): number {
  const lat1 = (origin.latitude * Math.PI) / 180
  const lat2 = (target.latitude * Math.PI) / 180
  const dLat = ((target.latitude - origin.latitude) * Math.PI) / 180
  const dLng = ((target.longitude - origin.longitude) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

export function resolveBoundingBox(latitude: number, longitude: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32
  const lngDelta = radiusKm / (111.32 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.01))

  return {
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLng: longitude - lngDelta,
    maxLng: longitude + lngDelta,
  }
}

export function normalizeListLocaisQuery(query: ListRunningRouteLocaisQuery) {
  const radiusKm = Math.min(
    Math.max(query.radiusKm ?? DEFAULT_LOCAIS_RADIUS_KM, 1),
    MAX_LOCAIS_RADIUS_KM,
  )
  const pageSize = Math.min(
    Math.max(query.pageSize ?? DEFAULT_LOCAIS_PAGE_SIZE, 1),
    MAX_LOCAIS_PAGE_SIZE,
  )
  const page = Math.max(query.page ?? 1, 1)

  if (
    !Number.isFinite(query.latitude) ||
    !Number.isFinite(query.longitude) ||
    query.latitude < -90 ||
    query.latitude > 90 ||
    query.longitude < -180 ||
    query.longitude > 180
  ) {
    throw new VdRunWalkError('Informe coordenadas válidas.', 'INVALID_DATA', 400)
  }

  return {
    latitude: query.latitude,
    longitude: query.longitude,
    radiusKm,
    page,
    pageSize,
  }
}

export function resolveCoverPhotoReference(input: CreateRunningRouteLocalInput): string | null {
  if (input.coverPhotoStoragePath?.trim()) {
    return toStoredRunWalkLocalCoverReference(input.coverPhotoStoragePath.trim())
  }

  if (input.coverPhotoUrl?.trim()) {
    return input.coverPhotoUrl.trim()
  }

  return null
}

export async function mapRunningRouteSpotRowToDto(
  row: RunningRouteSpotRow,
  origin: { latitude: number; longitude: number },
): Promise<RunningRouteLocalDto> {
  const coverPhotoUrl = await resolveRunWalkLocalCoverPublicUrl(row.cover_photo_url)

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    latitude: row.latitude,
    longitude: row.longitude,
    addressLabel: row.address_label,
    locationSource: row.location_source,
    coverPhotoUrl,
    submittedByCpf: row.submitted_by_cpf,
    submittedByName: row.submitted_by_name,
    recommendCount: row.recommend_count,
    notRecommendCount: row.not_recommend_count,
    distanceKm: haversineDistanceKm(origin, {
      latitude: row.latitude,
      longitude: row.longitude,
    }),
    createdAt: row.created_at,
  }
}

export async function buildLocaisListDto(
  rows: RunningRouteSpotRow[],
  origin: { latitude: number; longitude: number },
  radiusKm: number,
  page: number,
  pageSize: number,
): Promise<RunningRouteLocaisListDto> {
  const withinRadius = rows
    .map((row) => ({
      row,
      distanceKm: haversineDistanceKm(origin, {
        latitude: row.latitude,
        longitude: row.longitude,
      }),
    }))
    .filter((item) => item.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm || b.row.created_at.localeCompare(a.row.created_at))

  const totalCount = withinRadius.length
  const offset = (page - 1) * pageSize
  const pageRows = withinRadius.slice(offset, offset + pageSize)

  const spots = await Promise.all(
    pageRows.map((item) => mapRunningRouteSpotRowToDto(item.row, origin)),
  )

  return {
    spots,
    totalCount,
    hasMore: offset + pageSize < totalCount,
    page,
    pageSize,
  }
}

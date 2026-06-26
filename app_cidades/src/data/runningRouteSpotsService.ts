import AsyncStorage from '@react-native-async-storage/async-storage'
import { appEnv } from '../config/env'
import type {
  RunningRouteSpotRecord,
  SubmitRunningRouteSpotInput,
} from '../types/nearbyRunningRoutes'

const LOCAL_STORE_KEY = '@telefarmed/running-route-spots-v1'

type RemoteSpotRow = {
  id: string
  name: string
  description: string
  type: RunningRouteSpotRecord['type']
  latitude: number
  longitude: number
  address_label: string | null
  location_source: RunningRouteSpotRecord['locationSource']
  cover_photo_url: string | null
  submitted_by_cpf: string | null
  submitted_by_name: string | null
  recommend_count: number
  not_recommend_count: number
  created_at: string
}

function isRemoteConfigured() {
  return Boolean(appEnv.supabaseUrl && appEnv.supabaseAnonKey)
}

function remoteHeaders(prefer?: string) {
  return {
    apikey: appEnv.supabaseAnonKey,
    Authorization: `Bearer ${appEnv.supabaseAnonKey}`,
    'Content-Type': 'application/json',
    ...(prefer ? { Prefer: prefer } : {}),
  }
}

function mapRemoteRow(row: RemoteSpotRow): RunningRouteSpotRecord {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    latitude: row.latitude,
    longitude: row.longitude,
    addressLabel: row.address_label ?? undefined,
    locationSource: row.location_source ?? undefined,
    coverPhotoUri: row.cover_photo_url,
    submittedByCpf: row.submitted_by_cpf ?? undefined,
    submittedByName: row.submitted_by_name ?? undefined,
    recommendCount: row.recommend_count,
    notRecommendCount: row.not_recommend_count,
    createdAt: row.created_at,
  }
}

function mapRemoteInsert(input: SubmitRunningRouteSpotInput, coverPhotoUrl: string | null) {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    type: input.type,
    latitude: input.latitude,
    longitude: input.longitude,
    address_label: input.addressLabel.trim(),
    location_source: input.locationSource,
    cover_photo_url: coverPhotoUrl,
    submitted_by_cpf: input.submittedByCpf,
    submitted_by_name: input.submittedByName,
  }
}

async function readLocalStore(): Promise<RunningRouteSpotRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_STORE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as RunningRouteSpotRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeLocalStore(spots: RunningRouteSpotRecord[]) {
  await AsyncStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(spots))
}

async function fetchRemoteSpots(): Promise<RunningRouteSpotRecord[]> {
  if (!isRemoteConfigured()) return []

  const url = `${appEnv.supabaseUrl}/rest/v1/running_route_spots?select=*&order=created_at.desc`
  const response = await fetch(url, {
    headers: remoteHeaders(),
  })

  if (!response.ok) {
    throw new Error('Failed to load running route spots')
  }

  const rows = (await response.json()) as RemoteSpotRow[]
  return rows.map(mapRemoteRow)
}

async function insertRemoteSpot(
  input: SubmitRunningRouteSpotInput,
  coverPhotoUrl: string | null,
): Promise<RunningRouteSpotRecord | null> {
  if (!isRemoteConfigured()) return null

  const url = `${appEnv.supabaseUrl}/rest/v1/running_route_spots`
  const response = await fetch(url, {
    method: 'POST',
    headers: remoteHeaders('return=representation'),
    body: JSON.stringify(mapRemoteInsert(input, coverPhotoUrl)),
  })

  if (!response.ok) return null

  const rows = (await response.json()) as RemoteSpotRow[]
  const row = rows[0]
  return row ? mapRemoteRow(row) : null
}

function mergeSpots(
  remoteSpots: RunningRouteSpotRecord[],
  localSpots: RunningRouteSpotRecord[],
): RunningRouteSpotRecord[] {
  const byId = new Map<string, RunningRouteSpotRecord>()

  for (const spot of remoteSpots) {
    byId.set(spot.id, spot)
  }

  for (const spot of localSpots) {
    if (!byId.has(spot.id)) {
      byId.set(spot.id, spot)
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aTime = a.createdAt ?? ''
    const bTime = b.createdAt ?? ''
    return bTime.localeCompare(aTime)
  })
}

export async function listRunningRouteSpots(): Promise<RunningRouteSpotRecord[]> {
  const localSpots = await readLocalStore()

  try {
    const remoteSpots = await fetchRemoteSpots()
    return mergeSpots(remoteSpots, localSpots)
  } catch {
    return localSpots
  }
}

export async function submitRunningRouteSpot(
  input: SubmitRunningRouteSpotInput,
): Promise<RunningRouteSpotRecord> {
  const createdAt = new Date().toISOString()
  const localRecord: RunningRouteSpotRecord = {
    id: `local-${Date.now()}`,
    name: input.name.trim(),
    type: input.type,
    description: input.description.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    addressLabel: input.addressLabel.trim(),
    locationSource: input.locationSource,
    coverPhotoUri: input.coverPhotoUri,
    submittedByCpf: input.submittedByCpf,
    submittedByName: input.submittedByName,
    recommendCount: 0,
    notRecommendCount: 0,
    createdAt,
  }

  const remoteRecord = await insertRemoteSpot(input, input.coverPhotoUri)
  const saved = remoteRecord ?? localRecord

  const localSpots = await readLocalStore()
  await writeLocalStore([saved, ...localSpots.filter((spot) => spot.id !== saved.id)])

  return saved
}

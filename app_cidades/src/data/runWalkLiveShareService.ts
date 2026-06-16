import AsyncStorage from '@react-native-async-storage/async-storage'
import { appEnv } from '../config/env'
import type {
  AppendLiveSharePointInput,
  CreateLiveShareSessionInput,
  LiveSharePoint,
  LiveShareSession,
  LiveShareSessionSnapshot,
} from '../types/runWalkLiveShare'
import { generateLiveShareToken, normalizeLiveShareToken } from '../utils/runWalkLiveShareToken'

const LOCAL_STORE_KEY = '@telefarmed/run-walk-live-share-sessions'
const ACTIVE_SESSION_KEY = '@telefarmed/run-walk-active-live-session'

type RemoteSessionRow = {
  id: string
  share_token: string
  participant_name: string
  activity_name: string
  is_active: boolean
  started_at: string
  expires_at: string
}

type RemotePointRow = {
  id: string
  session_id: string
  latitude: number
  longitude: number
  accuracy_meters: number | null
  recorded_at: string
}

type LocalStore = Record<string, LiveShareSessionSnapshot>

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

function mapSession(row: RemoteSessionRow): LiveShareSession {
  return {
    id: row.id,
    shareToken: row.share_token,
    participantName: row.participant_name,
    activityName: row.activity_name,
    isActive: row.is_active,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
  }
}

function mapPoint(row: RemotePointRow): LiveSharePoint {
  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracyMeters: row.accuracy_meters,
    recordedAt: row.recorded_at,
  }
}

async function readLocalStore(): Promise<LocalStore> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_STORE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as LocalStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeLocalStore(store: LocalStore) {
  await AsyncStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(store))
}

async function createLocalSession(input: CreateLiveShareSessionInput): Promise<LiveShareSessionSnapshot> {
  const store = await readLocalStore()
  const shareToken = generateLiveShareToken()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000)
  const sessionId = `local-${now.getTime()}`

  const hasCoordinates = input.latitude != null && input.longitude != null
  const points: LiveSharePoint[] = hasCoordinates
    ? [
        {
          id: `${sessionId}-point-1`,
          latitude: input.latitude!,
          longitude: input.longitude!,
          accuracyMeters: input.accuracyMeters ?? null,
          recordedAt: now.toISOString(),
        },
      ]
    : []

  const snapshot: LiveShareSessionSnapshot = {
    id: sessionId,
    shareToken,
    participantName: input.participantName,
    activityName: input.activityName,
    isActive: true,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    points,
  }

  store[shareToken] = snapshot
  await writeLocalStore(store)
  await saveActiveLiveShareSession(snapshot)
  return snapshot
}

async function appendLocalPoint(input: AppendLiveSharePointInput): Promise<LiveSharePoint | null> {
  const store = await readLocalStore()
  const entry = Object.values(store).find((session) => session.id === input.sessionId)
  if (!entry) return null

  const point: LiveSharePoint = {
    id: `${input.sessionId}-point-${entry.points.length + 1}`,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracyMeters: input.accuracyMeters ?? null,
    recordedAt: new Date().toISOString(),
  }

  entry.points = [...entry.points, point]
  store[entry.shareToken] = entry
  await writeLocalStore(store)
  await saveActiveLiveShareSession(entry)
  return point
}

async function fetchLocalSessionByToken(token: string): Promise<LiveShareSessionSnapshot | null> {
  const normalized = normalizeLiveShareToken(token)
  const store = await readLocalStore()
  return store[normalized] ?? null
}

async function createRemoteSession(input: CreateLiveShareSessionInput): Promise<LiveShareSessionSnapshot> {
  const shareToken = generateLiveShareToken()
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()

  const sessionResponse = await fetch(`${appEnv.supabaseUrl}/rest/v1/run_walk_live_sessions`, {
    method: 'POST',
    headers: remoteHeaders('return=representation'),
    body: JSON.stringify({
      share_token: shareToken,
      participant_name: input.participantName,
      activity_name: input.activityName,
      is_active: true,
      expires_at: expiresAt,
    }),
  })

  if (!sessionResponse.ok) {
    throw new Error('Não foi possível iniciar o compartilhamento ao vivo.')
  }

  const sessionRows = (await sessionResponse.json()) as RemoteSessionRow[]
  const session = mapSession(sessionRows[0])

  const hasCoordinates = input.latitude != null && input.longitude != null
  let points: LiveSharePoint[] = []

  if (hasCoordinates) {
    const pointResponse = await fetch(`${appEnv.supabaseUrl}/rest/v1/run_walk_live_points`, {
      method: 'POST',
      headers: remoteHeaders('return=representation'),
      body: JSON.stringify({
        session_id: session.id,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy_meters: input.accuracyMeters ?? null,
      }),
    })

    if (!pointResponse.ok) {
      throw new Error('Não foi possível registrar a primeira localização.')
    }

    const pointRows = (await pointResponse.json()) as RemotePointRow[]
    points = pointRows.map(mapPoint)
  }

  const snapshot: LiveShareSessionSnapshot = {
    ...session,
    points,
  }

  await saveActiveLiveShareSession(snapshot)
  return snapshot
}

async function appendRemotePoint(input: AppendLiveSharePointInput): Promise<LiveSharePoint | null> {
  const response = await fetch(`${appEnv.supabaseUrl}/rest/v1/run_walk_live_points`, {
    method: 'POST',
    headers: remoteHeaders('return=representation'),
    body: JSON.stringify({
      session_id: input.sessionId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy_meters: input.accuracyMeters ?? null,
    }),
  })

  if (!response.ok) return null
  const rows = (await response.json()) as RemotePointRow[]
  return rows[0] ? mapPoint(rows[0]) : null
}

async function fetchRemoteSessionByToken(token: string): Promise<LiveShareSessionSnapshot | null> {
  const normalized = normalizeLiveShareToken(token)
  const sessionUrl =
    `${appEnv.supabaseUrl}/rest/v1/run_walk_live_sessions` +
    `?share_token=eq.${encodeURIComponent(normalized)}` +
    '&select=*'

  const sessionResponse = await fetch(sessionUrl, {
    headers: remoteHeaders(),
  })

  if (!sessionResponse.ok) return null

  const sessionRows = (await sessionResponse.json()) as RemoteSessionRow[]
  const sessionRow = sessionRows[0]
  if (!sessionRow) return null

  const pointsUrl =
    `${appEnv.supabaseUrl}/rest/v1/run_walk_live_points` +
    `?session_id=eq.${encodeURIComponent(sessionRow.id)}` +
    '&select=*&order=recorded_at.asc'

  const pointsResponse = await fetch(pointsUrl, {
    headers: remoteHeaders(),
  })

  if (!pointsResponse.ok) {
    return {
      ...mapSession(sessionRow),
      points: [],
    }
  }

  const pointRows = (await pointsResponse.json()) as RemotePointRow[]
  return {
    ...mapSession(sessionRow),
    points: pointRows.map(mapPoint),
  }
}

async function endRemoteSession(sessionId: string) {
  await fetch(`${appEnv.supabaseUrl}/rest/v1/run_walk_live_sessions?id=eq.${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    headers: remoteHeaders('return=minimal'),
    body: JSON.stringify({ is_active: false }),
  })
}

async function endLocalSession(sessionId: string) {
  const store = await readLocalStore()
  const entry = Object.values(store).find((session) => session.id === sessionId)
  if (!entry) return

  entry.isActive = false
  store[entry.shareToken] = entry
  await writeLocalStore(store)
}

export async function createLiveShareSession(
  input: CreateLiveShareSessionInput,
): Promise<LiveShareSessionSnapshot> {
  if (isRemoteConfigured()) {
    try {
      return await createRemoteSession(input)
    } catch {
      return createLocalSession(input)
    }
  }

  return createLocalSession(input)
}

export async function appendLiveSharePoint(
  input: AppendLiveSharePointInput,
): Promise<LiveSharePoint | null> {
  if (isRemoteConfigured() && !input.sessionId.startsWith('local-')) {
    try {
      return await appendRemotePoint(input)
    } catch {
      return appendLocalPoint(input)
    }
  }

  return appendLocalPoint(input)
}

export async function fetchLiveShareSessionByToken(
  token: string,
): Promise<LiveShareSessionSnapshot | null> {
  if (isRemoteConfigured()) {
    try {
      const remote = await fetchRemoteSessionByToken(token)
      if (remote) return remote
    } catch {
      // fallback below
    }
  }

  return fetchLocalSessionByToken(token)
}

export async function endLiveShareSession(sessionId: string) {
  if (isRemoteConfigured() && !sessionId.startsWith('local-')) {
    try {
      await endRemoteSession(sessionId)
    } catch {
      await endLocalSession(sessionId)
    }
  } else {
    await endLocalSession(sessionId)
  }

  await clearActiveLiveShareSession()
}

export async function saveActiveLiveShareSession(session: LiveShareSessionSnapshot) {
  await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session))
}

export async function loadActiveLiveShareSession(): Promise<LiveShareSessionSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as LiveShareSessionSnapshot
  } catch {
    return null
  }
}

export async function clearActiveLiveShareSession() {
  await AsyncStorage.removeItem(ACTIVE_SESSION_KEY)
}

export function isLiveShareRemoteEnabled() {
  return isRemoteConfigured()
}

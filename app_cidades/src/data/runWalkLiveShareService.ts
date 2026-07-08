import AsyncStorage from '@react-native-async-storage/async-storage'
import { LIVE_SHARE_POINT_BATCH_SIZE } from '../constants/runWalkLiveShare'
import { fetchPublicLiveShareSession } from '../lib/api/public/runWalkLiveShare'
import {
  appendRunWalkLiveSessionPoints,
  createRunWalkLiveSession,
  endRunWalkLiveSession,
  type CreateRunWalkLiveSessionInput,
} from '../lib/api/vd/runWalkLiveShare'
import { loadPersistedAccessToken } from '../lib/vd/vdAccessToken'
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

type LocalStore = Record<string, LiveShareSessionSnapshot>

async function canUseAuthenticatedLiveShare(): Promise<boolean> {
  const token = await loadPersistedAccessToken()
  return Boolean(token)
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

async function createRemoteSession(
  input: CreateLiveShareSessionInput,
): Promise<LiveShareSessionSnapshot> {
  const body: CreateRunWalkLiveSessionInput = {
    participantName: input.participantName,
    activityName: input.activityName,
  }

  if (input.latitude != null && input.longitude != null) {
    body.initialPoint = {
      latitude: input.latitude,
      longitude: input.longitude,
      accuracyMeters: input.accuracyMeters ?? null,
    }
  }

  const result = await createRunWalkLiveSession(body)

  return {
    ...result.session,
    points: result.points,
  }
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
    recordedAt: input.recordedAt ?? new Date().toISOString(),
  }

  entry.points = [...entry.points, point]
  store[entry.shareToken] = entry
  await writeLocalStore(store)
  await saveActiveLiveShareSession(entry)
  return point
}

async function appendRemotePoints(
  sessionId: string,
  inputs: AppendLiveSharePointInput[],
): Promise<LiveSharePoint[]> {
  const appended: LiveSharePoint[] = []

  for (let index = 0; index < inputs.length; index += LIVE_SHARE_POINT_BATCH_SIZE) {
    const chunk = inputs.slice(index, index + LIVE_SHARE_POINT_BATCH_SIZE)
    const result = await appendRunWalkLiveSessionPoints(sessionId, {
      points: chunk.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
        accuracyMeters: point.accuracyMeters ?? null,
        recordedAt: point.recordedAt ?? new Date().toISOString(),
      })),
    })
    appended.push(...result.points)
  }

  return appended
}

async function appendLocalPoints(inputs: AppendLiveSharePointInput[]): Promise<LiveSharePoint[]> {
  const appended: LiveSharePoint[] = []
  for (const input of inputs) {
    const point = await appendLocalPoint(input)
    if (point) appended.push(point)
  }
  return appended
}

export async function createLiveShareSession(
  input: CreateLiveShareSessionInput,
): Promise<LiveShareSessionSnapshot> {
  if (await canUseAuthenticatedLiveShare()) {
    try {
      const snapshot = await createRemoteSession(input)
      await saveActiveLiveShareSession(snapshot)
      return snapshot
    } catch {
      // fallback local abaixo
    }
  }

  return createLocalSession(input)
}

export async function appendLiveSharePoint(
  input: AppendLiveSharePointInput,
): Promise<LiveSharePoint | null> {
  const points = await appendLiveSharePoints([input])
  return points[0] ?? null
}

export async function appendLiveSharePoints(
  inputs: AppendLiveSharePointInput[],
): Promise<LiveSharePoint[]> {
  if (inputs.length === 0) return []

  const sessionId = inputs[0]?.sessionId
  if (!sessionId || inputs.some((input) => input.sessionId !== sessionId)) {
    return []
  }

  if (sessionId.startsWith('local-')) {
    return appendLocalPoints(inputs)
  }

  if (!(await canUseAuthenticatedLiveShare())) {
    return []
  }

  return appendRemotePoints(sessionId, inputs)
}

export async function fetchLocalLiveShareSessionByToken(
  token: string,
): Promise<LiveShareSessionSnapshot | null> {
  const normalized = normalizeLiveShareToken(token)
  const store = await readLocalStore()
  return store[normalized] ?? null
}

export async function fetchLiveShareSessionByToken(
  token: string,
): Promise<LiveShareSessionSnapshot | null> {
  const normalized = normalizeLiveShareToken(token)
  if (!normalized) return null

  const local = await fetchLocalLiveShareSessionByToken(normalized)
  if (local) return local

  try {
    return await fetchPublicLiveShareSession(normalized)
  } catch {
    return null
  }
}

export async function endLiveShareSession(sessionId: string) {
  if (!sessionId.startsWith('local-') && (await canUseAuthenticatedLiveShare())) {
    try {
      await endRunWalkLiveSession(sessionId)
    } catch {
      await endLocalSession(sessionId)
    }
  } else {
    await endLocalSession(sessionId)
  }

  await clearActiveLiveShareSession()
}

async function endLocalSession(sessionId: string) {
  const store = await readLocalStore()
  const entry = Object.values(store).find((session) => session.id === sessionId)
  if (!entry) return

  entry.isActive = false
  store[entry.shareToken] = entry
  await writeLocalStore(store)
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

export function isLocalLiveShareSession(session: Pick<LiveShareSession, 'id'>): boolean {
  return session.id.startsWith('local-')
}

export function isRemoteLiveShareSession(sessionId: string | null | undefined): boolean {
  return Boolean(sessionId && !sessionId.startsWith('local-'))
}

export async function shouldReplaceLiveShareSession(
  session: LiveShareSessionSnapshot | null | undefined,
): Promise<boolean> {
  if (!session?.isActive) return true
  if ((await canUseAuthenticatedLiveShare()) && isLocalLiveShareSession(session)) return true
  return false
}

export async function isLiveShareRemoteEnabled() {
  return canUseAuthenticatedLiveShare()
}

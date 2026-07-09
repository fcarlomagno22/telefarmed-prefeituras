import AsyncStorage from '@react-native-async-storage/async-storage'
import { isActiveMindApiEnabled } from '../config/activeMindApi'
import {
  deleteActiveMindSession,
  listActiveMindSessions,
  mapActiveMindSessaoDtoToSession,
} from '../lib/api/vd/activeMind'
import type { ActiveMindSession } from '../types/activeMindSession'
import {
  loadActiveMindSessionSyncQueue,
  removeActiveMindSessionSyncEntries,
} from './activeMindSessionSyncQueue'

const STORAGE_KEY = '@telefarmed/active-mind-sessions'
const MAX_SESSIONS_PER_PATIENT = 500
const REMOTE_PAGE_SIZE = 50
const MAX_REMOTE_PAGES = 10

type ActiveMindSessionStore = Record<string, ActiveMindSession[]>

function isGuestPatient(patientCpf: string) {
  return patientCpf === 'guest'
}

function shouldUseActiveMindApi(patientCpf: string) {
  return isActiveMindApiEnabled() && !isGuestPatient(patientCpf)
}

function sortSessions(sessions: ActiveMindSession[]) {
  return [...sessions].sort((left, right) => right.completedAt.localeCompare(left.completedAt))
}

function trimSessions(sessions: ActiveMindSession[]) {
  return sortSessions(sessions).slice(0, MAX_SESSIONS_PER_PATIENT)
}

async function readStore(): Promise<ActiveMindSessionStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as ActiveMindSessionStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: ActiveMindSessionStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

async function writePatientSessions(patientCpf: string, sessions: ActiveMindSession[]) {
  const store = await readStore()
  store[patientCpf] = trimSessions(sessions)
  await writeStore(store)
}

async function upsertSessionCache(
  patientCpf: string,
  session: ActiveMindSession,
): Promise<ActiveMindSession> {
  const store = await readStore()
  const current = Array.isArray(store[patientCpf]) ? store[patientCpf] : []
  const withoutDuplicate = current.filter((item) => item.id !== session.id)
  const next = trimSessions([session, ...withoutDuplicate])
  store[patientCpf] = next
  await writeStore(store)
  return session
}

function mergeSessions(
  local: ActiveMindSession[],
  remote: ActiveMindSession[],
): ActiveMindSession[] {
  const byId = new Map<string, ActiveMindSession>()

  for (const session of local) {
    byId.set(session.id, session)
  }

  for (const session of remote) {
    const existing = byId.get(session.id)
    byId.set(session.id, {
      ...existing,
      ...session,
      serverId: session.serverId ?? existing?.serverId,
      syncedAt: session.syncedAt ?? existing?.syncedAt,
    })
  }

  return trimSessions([...byId.values()])
}

export async function loadSessions(patientCpf: string): Promise<ActiveMindSession[]> {
  const store = await readStore()
  const cached = Array.isArray(store[patientCpf]) ? store[patientCpf] : []
  const queue = await loadActiveMindSessionSyncQueue(patientCpf)
  const pending = queue.map((item) => item.session)
  const byId = new Map<string, ActiveMindSession>()

  for (const session of [...cached, ...pending]) {
    byId.set(session.id, session)
  }

  return sortSessions([...byId.values()])
}

export async function getSessionById(
  patientCpf: string,
  id: string,
): Promise<ActiveMindSession | null> {
  const sessions = await loadSessions(patientCpf)
  return sessions.find((session) => session.id === id) ?? null
}

export async function markSessionSynced(
  patientCpf: string,
  id: string,
  serverId: string,
): Promise<ActiveMindSession | null> {
  const store = await readStore()
  const current = Array.isArray(store[patientCpf]) ? store[patientCpf] : []
  const index = current.findIndex((session) => session.id === id)
  if (index < 0) return null

  const updated: ActiveMindSession = {
    ...current[index]!,
    serverId,
    syncedAt: new Date().toISOString(),
  }

  const withoutDuplicate = current.filter((session) => session.id !== id)
  await writePatientSessions(patientCpf, [updated, ...withoutDuplicate])
  return updated
}

/** Persiste sessão localmente (offline-first). Sync fica a cargo da fila. */
export async function saveSession(
  patientCpf: string,
  session: ActiveMindSession,
): Promise<ActiveMindSession> {
  return upsertSessionCache(patientCpf, session)
}

export async function removeSessionLocal(
  patientCpf: string,
  sessionId: string,
): Promise<void> {
  const store = await readStore()
  const current = Array.isArray(store[patientCpf]) ? store[patientCpf] : []
  await writePatientSessions(
    patientCpf,
    current.filter((session) => session.id !== sessionId),
  )
  await removeActiveMindSessionSyncEntries([`sync-${sessionId}`])
}

/**
 * Soft delete na API (quando houver serverId) + remove do cache local.
 * Offline: remove só localmente.
 */
export async function deleteSession(
  patientCpf: string,
  session: ActiveMindSession,
): Promise<void> {
  if (shouldUseActiveMindApi(patientCpf) && session.serverId) {
    try {
      await deleteActiveMindSession(session.serverId)
    } catch {
      // Continua removendo localmente para a UI refletir a exclusão.
    }
  }

  await removeSessionLocal(patientCpf, session.id)
}

/** GET /sessoes paginado, merge com cache local e retorna lista unificada. */
export async function syncSessionsFromRemote(
  patientCpf: string,
): Promise<ActiveMindSession[]> {
  if (!shouldUseActiveMindApi(patientCpf)) {
    return loadSessions(patientCpf)
  }

  const remoteSessions: ActiveMindSession[] = []
  let page = 1
  let hasMore = true
  const syncedAt = new Date().toISOString()

  while (hasMore && page <= MAX_REMOTE_PAGES) {
    const result = await listActiveMindSessions({
      page,
      pageSize: REMOTE_PAGE_SIZE,
    })

    for (const dto of result.sessions) {
      remoteSessions.push(mapActiveMindSessaoDtoToSession(dto, syncedAt))
    }

    hasMore = result.hasMore
    page += 1
  }

  const local = await loadSessions(patientCpf)
  const merged = mergeSessions(local, remoteSessions)
  await writePatientSessions(patientCpf, merged)
  return loadSessions(patientCpf)
}

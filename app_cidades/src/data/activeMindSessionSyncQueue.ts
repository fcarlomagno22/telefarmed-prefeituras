import AsyncStorage from '@react-native-async-storage/async-storage'
import { isActiveMindApiEnabled } from '../config/activeMindApi'
import {
  createActiveMindSession,
  mapActiveMindSessionToCreateInput,
} from '../lib/api/vd/activeMind'
import type { ActiveMindSession } from '../types/activeMindSession'

const STORAGE_KEY = '@telefarmed/active-mind-sync-queue'
const BACKOFF_MS = [400, 1000, 2000] as const
const MAX_ATTEMPTS = BACKOFF_MS.length

export type QueuedActiveMindSessionSync = {
  id: string
  patientCpf: string
  session: ActiveMindSession
  queuedAt: string
}

export type ActiveMindSessionSyncApiClient = {
  /** POST idempotente por `clientSessionId` (= session.id). */
  createSession: (session: ActiveMindSession) => Promise<{ serverId: string }>
  markSessionSynced: (sessionId: string, serverId: string) => Promise<void>
}

export type ProcessActiveMindSessionSyncResult = {
  syncedCount: number
  remainingCount: number
}

const processInFlight = new Map<string, Promise<ProcessActiveMindSessionSyncResult>>()

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function readQueue(): Promise<QueuedActiveMindSessionSync[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as QueuedActiveMindSessionSync[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeQueue(queue: QueuedActiveMindSessionSync[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export async function enqueueActiveMindSessionSync(
  patientCpf: string,
  session: ActiveMindSession,
): Promise<QueuedActiveMindSessionSync> {
  const queue = await readQueue()
  const existing = queue.find(
    (item) => item.patientCpf === patientCpf && item.session.id === session.id,
  )
  if (existing) return existing

  const queued: QueuedActiveMindSessionSync = {
    id: `sync-${session.id}`,
    patientCpf,
    session,
    queuedAt: new Date().toISOString(),
  }

  queue.push(queued)
  await writeQueue(queue)
  return queued
}

export async function loadActiveMindSessionSyncQueue(
  patientCpf?: string,
): Promise<QueuedActiveMindSessionSync[]> {
  const queue = await readQueue()
  if (!patientCpf) return queue
  return queue.filter((item) => item.patientCpf === patientCpf)
}

export async function removeActiveMindSessionSyncEntries(ids: string[]) {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const queue = await readQueue()
  await writeQueue(queue.filter((item) => !idSet.has(item.id)))
}

/**
 * Drena a fila com POST idempotente + mark synced.
 * Retry com backoff simples; para no primeiro item que esgotar tentativas
 * (itens restantes ficam na fila). Deduplica chamadas concorrentes por CPF.
 */
export async function processActiveMindSessionSyncQueue(
  patientCpf: string,
  apiClient: ActiveMindSessionSyncApiClient,
): Promise<ProcessActiveMindSessionSyncResult> {
  const existing = processInFlight.get(patientCpf)
  if (existing) return existing

  const run = (async (): Promise<ProcessActiveMindSessionSyncResult> => {
    const queue = await loadActiveMindSessionSyncQueue(patientCpf)
    if (queue.length === 0) {
      return { syncedCount: 0, remainingCount: 0 }
    }

    const syncedIds: string[] = []

    for (const item of queue) {
      let synced = false

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          const result = await apiClient.createSession(item.session)
          await apiClient.markSessionSynced(item.session.id, result.serverId)
          syncedIds.push(item.id)
          synced = true
          break
        } catch {
          if (attempt < MAX_ATTEMPTS - 1) {
            await sleep(BACKOFF_MS[attempt] ?? 2000)
          }
        }
      }

      if (!synced) break
    }

    if (syncedIds.length > 0) {
      await removeActiveMindSessionSyncEntries(syncedIds)
    }

    const remaining = await loadActiveMindSessionSyncQueue(patientCpf)
    return {
      syncedCount: syncedIds.length,
      remainingCount: remaining.length,
    }
  })()

  processInFlight.set(patientCpf, run)

  try {
    return await run
  } finally {
    processInFlight.delete(patientCpf)
  }
}

/** Dispara o processamento sem await — não bloqueia a UI. */
export function scheduleActiveMindSessionSyncQueueProcess(
  patientCpf: string,
  apiClient: ActiveMindSessionSyncApiClient,
): void {
  void processActiveMindSessionSyncQueue(patientCpf, apiClient)
}

function shouldProcessActiveMindSessionSync(patientCpf: string) {
  return isActiveMindApiEnabled() && patientCpf !== 'guest'
}

async function buildActiveMindSessionSyncApiClient(
  patientCpf: string,
): Promise<ActiveMindSessionSyncApiClient> {
  // Import dinâmico evita ciclo com activeMindSessionStorage.
  const { markSessionSynced } = await import('./activeMindSessionStorage')

  return {
    createSession: async (session) => {
      const result = await createActiveMindSession(mapActiveMindSessionToCreateInput(session))
      return { serverId: result.session.id }
    },
    markSessionSynced: async (sessionId, serverId) => {
      await markSessionSynced(patientCpf, sessionId, serverId)
    },
  }
}

/**
 * Drena a fila de sessões Ativa Mente após login/restore.
 * Fire-and-forget — não bloqueia a UI.
 */
export function startActiveMindSessionBackgroundSync(patientCpf: string): void {
  if (!shouldProcessActiveMindSessionSync(patientCpf)) return

  void (async () => {
    try {
      const apiClient = await buildActiveMindSessionSyncApiClient(patientCpf)
      await processActiveMindSessionSyncQueue(patientCpf, apiClient)
    } catch {
      // Offline ou erro transitório — itens permanecem na fila.
    }
  })()
}

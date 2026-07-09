import AsyncStorage from '@react-native-async-storage/async-storage'
import type { WorkoutSessionRecord } from '../types/functionalTraining'

const STORAGE_KEY = '@telefarmed/functional-session-sync-queue'

export type QueuedFunctionalTrainingSession = {
  id: string
  patientCpf: string
  session: WorkoutSessionRecord
  queuedAt: string
}

async function readQueue(): Promise<QueuedFunctionalTrainingSession[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as QueuedFunctionalTrainingSession[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeQueue(queue: QueuedFunctionalTrainingSession[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export async function enqueueFunctionalTrainingSessionSync(
  patientCpf: string,
  session: WorkoutSessionRecord,
): Promise<QueuedFunctionalTrainingSession> {
  const queue = await readQueue()
  const existing = queue.find(
    (entry) => entry.patientCpf === patientCpf && entry.session.id === session.id,
  )
  if (existing) return existing

  const entry: QueuedFunctionalTrainingSession = {
    id: `sync-${session.id}`,
    patientCpf,
    session,
    queuedAt: new Date().toISOString(),
  }

  queue.push(entry)
  await writeQueue(queue)
  return entry
}

export async function loadFunctionalTrainingSessionSyncQueue(
  patientCpf?: string,
): Promise<QueuedFunctionalTrainingSession[]> {
  const queue = await readQueue()
  if (!patientCpf) return queue
  return queue.filter((entry) => entry.patientCpf === patientCpf)
}

export async function removeFunctionalTrainingSessionSyncEntries(ids: string[]) {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const queue = await readQueue()
  await writeQueue(queue.filter((entry) => !idSet.has(entry.id)))
}

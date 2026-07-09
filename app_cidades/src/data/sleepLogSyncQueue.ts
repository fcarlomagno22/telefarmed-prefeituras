import AsyncStorage from '@react-native-async-storage/async-storage'
import type { SleepLogEntry } from '../types/sleepLog'

const STORAGE_KEY = '@telefarmed/sleep-log-sync-queue'

export type QueuedSleepLogSync = {
  id: string
  patientCpf: string
  entry: SleepLogEntry
  queuedAt: string
}

async function readQueue(): Promise<QueuedSleepLogSync[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as QueuedSleepLogSync[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeQueue(queue: QueuedSleepLogSync[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export async function enqueueSleepLogSync(
  patientCpf: string,
  entry: SleepLogEntry,
): Promise<QueuedSleepLogSync> {
  const queue = await readQueue()
  const existing = queue.find(
    (item) => item.patientCpf === patientCpf && item.entry.id === entry.id,
  )
  if (existing) return existing

  const queued: QueuedSleepLogSync = {
    id: `sync-${entry.id}`,
    patientCpf,
    entry,
    queuedAt: new Date().toISOString(),
  }

  queue.push(queued)
  await writeQueue(queue)
  return queued
}

export async function loadSleepLogSyncQueue(patientCpf?: string): Promise<QueuedSleepLogSync[]> {
  const queue = await readQueue()
  if (!patientCpf) return queue
  return queue.filter((item) => item.patientCpf === patientCpf)
}

export async function removeSleepLogSyncEntries(ids: string[]) {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const queue = await readQueue()
  await writeQueue(queue.filter((item) => !idSet.has(item.id)))
}

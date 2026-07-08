import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RunWalkActivitySummary } from './runWalkActivitySummaryStorage'

const STORAGE_KEY = '@telefarmed/run-walk-activity-sync-queue'

export type QueuedRunWalkActivity = {
  id: string
  patientCpf: string
  activity: RunWalkActivitySummary
  queuedAt: string
}

async function readQueue(): Promise<QueuedRunWalkActivity[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as QueuedRunWalkActivity[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeQueue(queue: QueuedRunWalkActivity[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export async function enqueueRunWalkActivitySync(
  patientCpf: string,
  activity: RunWalkActivitySummary,
): Promise<QueuedRunWalkActivity> {
  const queue = await readQueue()
  const existing = queue.find(
    (entry) =>
      entry.patientCpf === patientCpf &&
      entry.activity.id === activity.id,
  )
  if (existing) return existing

  const entry: QueuedRunWalkActivity = {
    id: `sync-${activity.id}`,
    patientCpf,
    activity,
    queuedAt: new Date().toISOString(),
  }

  queue.push(entry)
  await writeQueue(queue)
  return entry
}

export async function loadRunWalkActivitySyncQueue(
  patientCpf?: string,
): Promise<QueuedRunWalkActivity[]> {
  const queue = await readQueue()
  if (!patientCpf) return queue
  return queue.filter((entry) => entry.patientCpf === patientCpf)
}

export async function removeRunWalkActivitySyncEntries(ids: string[]) {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const queue = await readQueue()
  await writeQueue(queue.filter((entry) => !idSet.has(entry.id)))
}

export async function clearRunWalkActivitySyncQueue() {
  await AsyncStorage.removeItem(STORAGE_KEY)
}

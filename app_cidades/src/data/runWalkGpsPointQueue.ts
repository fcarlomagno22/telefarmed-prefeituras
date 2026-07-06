import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@telefarmed/run-walk-gps-queue'

export type RunWalkQueuedGpsPoint = {
  id: string
  sessionId: string
  latitude: number
  longitude: number
  accuracyMeters: number | null
  recordedAt: string
}

async function readQueue(): Promise<RunWalkQueuedGpsPoint[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RunWalkQueuedGpsPoint[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeQueue(queue: RunWalkQueuedGpsPoint[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export async function enqueueRunWalkGpsPoint(
  point: Omit<RunWalkQueuedGpsPoint, 'id'>,
): Promise<RunWalkQueuedGpsPoint> {
  const queue = await readQueue()
  const entry: RunWalkQueuedGpsPoint = {
    ...point,
    id: `gps-${Date.now()}-${queue.length}`,
  }
  queue.push(entry)
  await writeQueue(queue)
  return entry
}

export async function loadRunWalkGpsQueue(): Promise<RunWalkQueuedGpsPoint[]> {
  return readQueue()
}

export async function removeRunWalkGpsPoints(ids: string[]) {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const queue = await readQueue()
  await writeQueue(queue.filter((point) => !idSet.has(point.id)))
}

export async function clearRunWalkGpsQueue() {
  await AsyncStorage.removeItem(STORAGE_KEY)
}

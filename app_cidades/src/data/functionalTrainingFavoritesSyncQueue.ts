import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@telefarmed/functional-favorites-sync-queue'

export type FunctionalTrainingFavoriteSyncOp = {
  id: string
  patientCpf: string
  type: 'add' | 'remove'
  exerciseId: string
  queuedAt: string
}

async function readQueue(): Promise<FunctionalTrainingFavoriteSyncOp[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as FunctionalTrainingFavoriteSyncOp[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeQueue(queue: FunctionalTrainingFavoriteSyncOp[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export async function enqueueFunctionalTrainingFavoriteSync(
  patientCpf: string,
  type: FunctionalTrainingFavoriteSyncOp['type'],
  exerciseId: string,
): Promise<FunctionalTrainingFavoriteSyncOp> {
  const queue = await readQueue()
  const filtered = queue.filter(
    (entry) =>
      !(
        entry.patientCpf === patientCpf &&
        entry.exerciseId === exerciseId
      ),
  )

  const entry: FunctionalTrainingFavoriteSyncOp = {
    id: `fav-sync-${patientCpf}-${exerciseId}-${Date.now()}`,
    patientCpf,
    type,
    exerciseId,
    queuedAt: new Date().toISOString(),
  }

  filtered.push(entry)
  await writeQueue(filtered)
  return entry
}

export async function loadFunctionalTrainingFavoriteSyncQueue(
  patientCpf?: string,
): Promise<FunctionalTrainingFavoriteSyncOp[]> {
  const queue = await readQueue()
  if (!patientCpf) return queue
  return queue.filter((entry) => entry.patientCpf === patientCpf)
}

export async function removeFunctionalTrainingFavoriteSyncEntries(ids: string[]) {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const queue = await readQueue()
  await writeQueue(queue.filter((entry) => !idSet.has(entry.id)))
}

export async function clearFunctionalTrainingFavoriteSyncQueue(patientCpf: string) {
  const queue = await readQueue()
  await writeQueue(queue.filter((entry) => entry.patientCpf !== patientCpf))
}

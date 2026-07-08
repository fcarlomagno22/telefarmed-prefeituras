import AsyncStorage from '@react-native-async-storage/async-storage'
import type { WeeklyGoalTargets } from '../types/runWalk'

const STORAGE_KEY = '@telefarmed/run-walk-weekly-goal-sync-queue'

export type QueuedWeeklyGoalTargets = {
  id: string
  patientCpf: string
  targets: WeeklyGoalTargets
  queuedAt: string
}

async function readQueue(): Promise<QueuedWeeklyGoalTargets[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as QueuedWeeklyGoalTargets[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeQueue(queue: QueuedWeeklyGoalTargets[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export async function enqueueWeeklyGoalTargetsSync(
  patientCpf: string,
  targets: WeeklyGoalTargets,
): Promise<QueuedWeeklyGoalTargets> {
  const queue = await readQueue()
  const existing = queue.find((entry) => entry.patientCpf === patientCpf)
  if (existing) {
    existing.targets = targets
    existing.queuedAt = new Date().toISOString()
    await writeQueue(queue)
    return existing
  }

  const entry: QueuedWeeklyGoalTargets = {
    id: `weekly-goal-${patientCpf}`,
    patientCpf,
    targets,
    queuedAt: new Date().toISOString(),
  }
  queue.push(entry)
  await writeQueue(queue)
  return entry
}

export async function loadWeeklyGoalTargetsSyncQueue(
  patientCpf?: string,
): Promise<QueuedWeeklyGoalTargets[]> {
  const queue = await readQueue()
  if (!patientCpf) return queue
  return queue.filter((entry) => entry.patientCpf === patientCpf)
}

export async function removeWeeklyGoalTargetsSyncEntries(ids: string[]) {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const queue = await readQueue()
  await writeQueue(queue.filter((entry) => !idSet.has(entry.id)))
}

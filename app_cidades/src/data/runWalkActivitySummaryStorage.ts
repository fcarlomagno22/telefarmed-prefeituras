import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ActivityModality } from '../types/auth'
import type { RunWalkActivityCheckIn } from '../types/runWalkActivityCheckIn'
import type { ActivityTrailPoint } from '../utils/runWalkActivityStats'

const STORAGE_KEY = '@telefarmed/run-walk-activity-summary'

export type RunWalkActivitySummary = {
  id: string
  patientCpf: string
  modality: ActivityModality
  activityName: string
  elapsedSeconds: number
  distanceKm: number
  averageSpeedKmh: number | null
  paceMinPerKm: number | null
  stepCount: number
  heartRateBpm: number
  estimatedCalories: number
  activeMinutes: number
  completedAt: string
  trail: ActivityTrailPoint[]
  locationCity?: string | null
  locationState?: string | null
  checkIn?: RunWalkActivityCheckIn | null
  checkInSkipped?: boolean
}

type SummaryStore = Record<string, RunWalkActivitySummary>

async function readStore(): Promise<SummaryStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as SummaryStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: SummaryStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function saveRunWalkActivitySummary(summary: RunWalkActivitySummary) {
  const store = await readStore()
  store[summary.id] = summary
  await writeStore(store)
}

export async function updateRunWalkActivitySummary(
  summaryId: string,
  patch: Partial<Pick<RunWalkActivitySummary, 'checkIn' | 'checkInSkipped'>>,
): Promise<RunWalkActivitySummary | null> {
  const store = await readStore()
  const current = store[summaryId]
  if (!current) return null

  const updated: RunWalkActivitySummary = {
    ...current,
    ...patch,
  }
  store[summaryId] = updated
  await writeStore(store)
  return updated
}

export async function loadRunWalkActivitySummary(
  summaryId: string,
): Promise<RunWalkActivitySummary | null> {
  const store = await readStore()
  return store[summaryId] ?? null
}

export async function clearRunWalkActivitySummary(summaryId: string) {
  const store = await readStore()
  delete store[summaryId]
  await writeStore(store)
}

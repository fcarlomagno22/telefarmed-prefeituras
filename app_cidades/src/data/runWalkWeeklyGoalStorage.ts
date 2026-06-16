import AsyncStorage from '@react-native-async-storage/async-storage'
import type { WeeklyGoalTargets } from '../types/runWalk'

const STORAGE_KEY = '@telefarmed/run-walk-weekly-goal'

type WeeklyGoalStore = Record<string, WeeklyGoalTargets>

async function readStore(): Promise<WeeklyGoalStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as WeeklyGoalStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: WeeklyGoalStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadWeeklyGoalTargets(
  patientCpf: string,
): Promise<WeeklyGoalTargets | null> {
  const store = await readStore()
  const targets = store[patientCpf]

  if (
    !targets ||
    targets.targetActivities <= 0 ||
    targets.targetActiveMinutes <= 0 ||
    targets.targetMovementDays <= 0
  ) {
    return null
  }

  return targets
}

export async function saveWeeklyGoalTargets(
  patientCpf: string,
  targets: WeeklyGoalTargets,
) {
  const store = await readStore()
  store[patientCpf] = targets
  await writeStore(store)
}

export async function clearWeeklyGoalTargets(patientCpf: string) {
  const store = await readStore()
  delete store[patientCpf]
  await writeStore(store)
}

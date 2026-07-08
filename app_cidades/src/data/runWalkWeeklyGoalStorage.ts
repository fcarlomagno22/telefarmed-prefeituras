import AsyncStorage from '@react-native-async-storage/async-storage'
import { isRunWalkApiEnabled } from '../config/runWalkApi'
import {
  getRunWalkMetasSemanais,
  putRunWalkMetasSemanais,
  type WeeklyGoalTargetsDto,
} from '../lib/api/vd/runWalk'
import type { WeeklyGoalTargets } from '../types/runWalk'
import {
  enqueueWeeklyGoalTargetsSync,
  loadWeeklyGoalTargetsSyncQueue,
  removeWeeklyGoalTargetsSyncEntries,
} from './runWalkWeeklyGoalSyncQueue'

const STORAGE_KEY = '@telefarmed/run-walk-weekly-goal'

type WeeklyGoalStore = Record<string, WeeklyGoalTargets>

function isGuestPatient(patientCpf: string) {
  return patientCpf === 'guest'
}

function isValidTargets(targets: WeeklyGoalTargets | null | undefined): targets is WeeklyGoalTargets {
  return (
    !!targets &&
    targets.targetActivities > 0 &&
    targets.targetActiveMinutes > 0 &&
    targets.targetMovementDays > 0
  )
}

function mapDtoTargets(targets: WeeklyGoalTargetsDto | null): WeeklyGoalTargets | null {
  if (!isValidTargets(targets)) return null
  return targets
}

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

export async function loadCachedWeeklyGoalTargets(
  patientCpf: string,
): Promise<WeeklyGoalTargets | null> {
  const store = await readStore()
  const targets = store[patientCpf]
  return isValidTargets(targets) ? targets : null
}

async function cacheWeeklyGoalTargets(patientCpf: string, targets: WeeklyGoalTargets | null) {
  const store = await readStore()
  if (targets) {
    store[patientCpf] = targets
  } else {
    delete store[patientCpf]
  }
  await writeStore(store)
}

export async function flushWeeklyGoalTargetsSyncQueue(patientCpf: string): Promise<void> {
  if (isGuestPatient(patientCpf) || !isRunWalkApiEnabled()) return

  const queue = await loadWeeklyGoalTargetsSyncQueue(patientCpf)
  if (queue.length === 0) return

  const syncedIds: string[] = []

  for (const entry of queue) {
    try {
      const result = await putRunWalkMetasSemanais(entry.targets)
      const targets = mapDtoTargets(result.targets)
      if (targets) {
        await cacheWeeklyGoalTargets(patientCpf, targets)
      }
      syncedIds.push(entry.id)
    } catch {
      break
    }
  }

  if (syncedIds.length > 0) {
    await removeWeeklyGoalTargetsSyncEntries(syncedIds)
  }
}

/** Carrega metas da semana via API com cache local; em falha usa cache ou fila pendente. */
export async function loadWeeklyGoalTargets(
  patientCpf: string,
): Promise<WeeklyGoalTargets | null> {
  if (isGuestPatient(patientCpf)) {
    return loadCachedWeeklyGoalTargets(patientCpf)
  }

  if (!isRunWalkApiEnabled()) {
    return loadCachedWeeklyGoalTargets(patientCpf)
  }

  await flushWeeklyGoalTargetsSyncQueue(patientCpf)

  try {
    const result = await getRunWalkMetasSemanais()
    const targets = mapDtoTargets(result.targets)
    await cacheWeeklyGoalTargets(patientCpf, targets)
    return targets
  } catch {
    const pending = await loadWeeklyGoalTargetsSyncQueue(patientCpf)
    const queuedTargets = pending[0]?.targets
    if (isValidTargets(queuedTargets)) {
      return queuedTargets
    }

    return loadCachedWeeklyGoalTargets(patientCpf)
  }
}

/** Salva metas via PUT com fallback offline (cache + fila de retry). */
export async function saveWeeklyGoalTargets(
  patientCpf: string,
  targets: WeeklyGoalTargets,
) {
  await cacheWeeklyGoalTargets(patientCpf, targets)

  if (isGuestPatient(patientCpf)) {
    return
  }

  if (!isRunWalkApiEnabled()) {
    return
  }

  try {
    const result = await putRunWalkMetasSemanais(targets)
    const savedTargets = mapDtoTargets(result.targets) ?? targets
    await cacheWeeklyGoalTargets(patientCpf, savedTargets)
    await removeWeeklyGoalTargetsSyncEntries([`weekly-goal-${patientCpf}`])
  } catch {
    await enqueueWeeklyGoalTargetsSync(patientCpf, targets)
  }
}

export async function clearWeeklyGoalTargets(patientCpf: string) {
  const store = await readStore()
  delete store[patientCpf]
  await writeStore(store)
}

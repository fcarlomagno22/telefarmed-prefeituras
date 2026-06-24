import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  emptyMyRoutineWeekPlan,
  mergeMyRoutineWeekPlan,
  type MyRoutineWeekPlan,
} from '../types/myRoutine'

const STORAGE_KEY = '@telefarmed/my-routine-week-plan'

type MyRoutineWeekPlanStore = Record<string, MyRoutineWeekPlan>

async function readStore(): Promise<MyRoutineWeekPlanStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as MyRoutineWeekPlanStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: MyRoutineWeekPlanStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function normalizeWeekPlan(record: Partial<MyRoutineWeekPlan>): MyRoutineWeekPlan {
  const weekStartIso = record.weekStartIso ?? emptyMyRoutineWeekPlan('1970-01-01').weekStartIso
  return mergeMyRoutineWeekPlan(emptyMyRoutineWeekPlan(weekStartIso), record)
}

export async function loadMyRoutineWeekPlan(patientCpf: string): Promise<MyRoutineWeekPlan | null> {
  const store = await readStore()
  const record = store[patientCpf]

  if (!record || typeof record !== 'object') return null

  return normalizeWeekPlan(record)
}

export async function saveMyRoutineWeekPlan(patientCpf: string, plan: MyRoutineWeekPlan) {
  const store = await readStore()
  store[patientCpf] = normalizeWeekPlan(plan)
  await writeStore(store)
}

export async function patchMyRoutineWeekPlan(
  patientCpf: string,
  patch: Partial<MyRoutineWeekPlan>,
): Promise<MyRoutineWeekPlan> {
  const current =
    (await loadMyRoutineWeekPlan(patientCpf)) ??
    emptyMyRoutineWeekPlan(patch.weekStartIso ?? new Date().toISOString().slice(0, 10))

  const next = mergeMyRoutineWeekPlan(current, {
    ...patch,
    updatedAt: new Date().toISOString(),
  })
  await saveMyRoutineWeekPlan(patientCpf, next)
  return next
}

export async function clearMyRoutineWeekPlan(patientCpf: string) {
  const store = await readStore()
  delete store[patientCpf]
  await writeStore(store)
}

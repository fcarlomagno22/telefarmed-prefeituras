import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  emptyMyRoutineDayPlan,
  mergeMyRoutineDayPlan,
  type MyRoutineDayClosure,
  type MyRoutineDayHistoryEntry,
  type MyRoutineDayPlan,
} from '../types/myRoutine'

const DAY_PLAN_KEY = '@telefarmed/my-routine-daily'
const CLOSURE_KEY = '@telefarmed/my-routine-day-closure'
const HISTORY_KEY = '@telefarmed/my-routine-day-history'

type DayPlanStore = Record<string, Record<string, MyRoutineDayPlan>>
type DayClosureStore = Record<string, Record<string, MyRoutineDayClosure>>
type DayHistoryStore = Record<string, MyRoutineDayHistoryEntry[]>

async function readDayPlanStore(): Promise<DayPlanStore> {
  try {
    const raw = await AsyncStorage.getItem(DAY_PLAN_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as DayPlanStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeDayPlanStore(store: DayPlanStore) {
  await AsyncStorage.setItem(DAY_PLAN_KEY, JSON.stringify(store))
}

async function readClosureStore(): Promise<DayClosureStore> {
  try {
    const raw = await AsyncStorage.getItem(CLOSURE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as DayClosureStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeClosureStore(store: DayClosureStore) {
  await AsyncStorage.setItem(CLOSURE_KEY, JSON.stringify(store))
}

async function readHistoryStore(): Promise<DayHistoryStore> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as DayHistoryStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeHistoryStore(store: DayHistoryStore) {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(store))
}

function normalizeDayPlan(dateIso: string, record: Partial<MyRoutineDayPlan>): MyRoutineDayPlan {
  return mergeMyRoutineDayPlan(emptyMyRoutineDayPlan(dateIso), record)
}

export async function loadMyRoutineDayPlan(
  patientCpf: string,
  dateIso: string,
): Promise<MyRoutineDayPlan | null> {
  const store = await readDayPlanStore()
  const record = store[patientCpf]?.[dateIso]
  if (!record || typeof record !== 'object') return null
  return normalizeDayPlan(dateIso, record)
}

export async function saveMyRoutineDayPlan(patientCpf: string, plan: MyRoutineDayPlan) {
  const store = await readDayPlanStore()
  const patientRecords = store[patientCpf] ?? {}
  patientRecords[plan.dateIso] = normalizeDayPlan(plan.dateIso, plan)
  store[patientCpf] = patientRecords
  await writeDayPlanStore(store)
}

export async function patchMyRoutineDayPlan(
  patientCpf: string,
  dateIso: string,
  patch: Partial<MyRoutineDayPlan>,
): Promise<MyRoutineDayPlan> {
  const current = (await loadMyRoutineDayPlan(patientCpf, dateIso)) ?? emptyMyRoutineDayPlan(dateIso)
  const next = mergeMyRoutineDayPlan(current, { ...patch, dateIso })
  await saveMyRoutineDayPlan(patientCpf, next)
  return next
}

export async function loadMyRoutineDayClosure(
  patientCpf: string,
  dateIso: string,
): Promise<MyRoutineDayClosure | null> {
  const store = await readClosureStore()
  const record = store[patientCpf]?.[dateIso]
  return record && typeof record === 'object' ? record : null
}

export async function saveMyRoutineDayClosure(patientCpf: string, closure: MyRoutineDayClosure) {
  const store = await readClosureStore()
  const patientRecords = store[patientCpf] ?? {}
  patientRecords[closure.dateIso] = closure
  store[patientCpf] = patientRecords
  await writeClosureStore(store)
}

export async function loadMyRoutineDayHistory(patientCpf: string): Promise<MyRoutineDayHistoryEntry[]> {
  const store = await readHistoryStore()
  const entries = store[patientCpf]
  return Array.isArray(entries) ? entries : []
}

export async function upsertMyRoutineDayHistoryEntry(
  patientCpf: string,
  entry: MyRoutineDayHistoryEntry,
) {
  const store = await readHistoryStore()
  const current = Array.isArray(store[patientCpf]) ? store[patientCpf] : []
  const withoutDate = current.filter((item) => item.dateIso !== entry.dateIso)
  const next = [...withoutDate, entry].sort((a, b) => a.dateIso.localeCompare(b.dateIso))
  store[patientCpf] = next
  await writeHistoryStore(store)
}

export async function appendMyRoutineDayHistoryFromPlan(
  patientCpf: string,
  plan: MyRoutineDayPlan,
) {
  const minimalTotal = plan.minimalRoutineTaskIds.length
  const minimalDone = plan.tasks.filter(
    (task) =>
      plan.minimalRoutineTaskIds.includes(task.id) &&
      (task.status === 'done' || task.status === 'skipped'),
  ).length

  await upsertMyRoutineDayHistoryEntry(patientCpf, {
    dateIso: plan.dateIso,
    minimalDone,
    minimalTotal,
    dayMode: plan.dayMode,
  })
}

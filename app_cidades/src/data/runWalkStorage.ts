import AsyncStorage from '@react-native-async-storage/async-storage'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

const STORAGE_KEY = '@telefarmed/run-walk-daily'

type RunWalkDailyRecord = {
  dateIso: string
  dispositionPromptHandled: boolean
  selectedActivityId: string | null
}

type RunWalkDailyStore = Record<string, RunWalkDailyRecord>

function todayIso() {
  return toLocalDateIso(new Date())
}

async function readStore(): Promise<RunWalkDailyStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as RunWalkDailyStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: RunWalkDailyStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function getFreshRecord(): RunWalkDailyRecord {
  return {
    dateIso: todayIso(),
    dispositionPromptHandled: false,
    selectedActivityId: null,
  }
}

export async function loadRunWalkDailyRecord(patientCpf: string): Promise<RunWalkDailyRecord> {
  const store = await readStore()
  const record = store[patientCpf]

  if (!record || record.dateIso !== todayIso()) {
    return getFreshRecord()
  }

  return record
}

export async function markDispositionPromptHandled(patientCpf: string) {
  const store = await readStore()
  const current = store[patientCpf]
  const base =
    current && current.dateIso === todayIso() ? current : getFreshRecord()

  store[patientCpf] = {
    ...base,
    dispositionPromptHandled: true,
  }

  await writeStore(store)
}

export async function saveTodayActivitySelection(
  patientCpf: string,
  activityId: string,
) {
  const store = await readStore()
  const current = store[patientCpf]
  const base =
    current && current.dateIso === todayIso() ? current : getFreshRecord()

  store[patientCpf] = {
    ...base,
    selectedActivityId: activityId,
  }

  await writeStore(store)
}

export async function clearTodayActivitySelection(patientCpf: string) {
  const store = await readStore()
  const current = store[patientCpf]

  if (!current || current.dateIso !== todayIso()) return

  store[patientCpf] = {
    ...current,
    selectedActivityId: null,
  }

  await writeStore(store)
}

import AsyncStorage from '@react-native-async-storage/async-storage'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

const STORAGE_KEY = '@telefarmed/mental-health-daily'

export type MentalHealthDailyRecord = {
  dateIso: string
  checkInCompleted: boolean
  journalEntryToday: boolean
}

type MentalHealthDailyStore = Record<string, MentalHealthDailyRecord>

function todayIso() {
  return toLocalDateIso(new Date())
}

async function readStore(): Promise<MentalHealthDailyStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as MentalHealthDailyStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: MentalHealthDailyStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function getFreshRecord(): MentalHealthDailyRecord {
  return {
    dateIso: todayIso(),
    checkInCompleted: false,
    journalEntryToday: false,
  }
}

export async function loadMentalHealthDailyRecord(patientCpf: string): Promise<MentalHealthDailyRecord> {
  const store = await readStore()
  const record = store[patientCpf]

  if (!record || record.dateIso !== todayIso()) {
    return getFreshRecord()
  }

  return {
    ...getFreshRecord(),
    ...record,
  }
}

export async function saveMentalHealthDailyRecord(
  patientCpf: string,
  record: MentalHealthDailyRecord,
) {
  const store = await readStore()
  store[patientCpf] = {
    ...record,
    dateIso: todayIso(),
  }
  await writeStore(store)
}

export async function hasMentalHealthSufficientHistory(patientCpf: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem('@telefarmed/mental-health-history-count')
    if (!raw) return false

    const parsed = JSON.parse(raw) as Record<string, number>
    return (parsed[patientCpf] ?? 0) >= 3
  } catch {
    return false
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage'
import type { SleepLogEntry } from '../types/sleepLog'

const STORAGE_KEY = '@telefarmed/sleep-logs'

type SleepLogStore = Record<string, SleepLogEntry[]>

async function readStore(): Promise<SleepLogStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as SleepLogStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: SleepLogStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadSleepLogs(patientCpf: string): Promise<SleepLogEntry[]> {
  const store = await readStore()
  const entries = store[patientCpf] ?? []
  return [...entries].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
}

export async function saveSleepLog(patientCpf: string, entry: SleepLogEntry) {
  const store = await readStore()
  const entries = store[patientCpf] ?? []
  store[patientCpf] = [entry, ...entries.filter((item) => item.id !== entry.id)]
  await writeStore(store)
}

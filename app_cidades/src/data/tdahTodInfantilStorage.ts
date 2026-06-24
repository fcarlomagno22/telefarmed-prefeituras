import AsyncStorage from '@react-native-async-storage/async-storage'
import type { TdahTodSessionRecord } from '../tdahTodInfantil/types'

const STORAGE_KEY = '@telefarmed/tdah-tod-infantil-v1'

type TdahTodStore = Record<string, TdahTodSessionRecord[]>

async function readStore(): Promise<TdahTodStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as TdahTodStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: TdahTodStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadTdahTodSessions(patientCpf: string): Promise<TdahTodSessionRecord[]> {
  const store = await readStore()
  return Array.isArray(store[patientCpf]) ? store[patientCpf] : []
}

export async function saveTdahTodSession(
  patientCpf: string,
  session: TdahTodSessionRecord,
): Promise<TdahTodSessionRecord[]> {
  const store = await readStore()
  const current = store[patientCpf] ?? []
  const next = [session, ...current.filter((item) => item.id !== session.id)]
  store[patientCpf] = next
  await writeStore(store)
  return next
}

export async function getTdahTodSession(
  patientCpf: string,
  sessionId: string,
): Promise<TdahTodSessionRecord | null> {
  const sessions = await loadTdahTodSessions(patientCpf)
  return sessions.find((item) => item.id === sessionId) ?? null
}

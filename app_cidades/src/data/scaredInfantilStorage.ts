import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ScaredSessionRecord } from '../scaredInfantil/types'

const STORAGE_KEY = '@telefarmed/scared-infantil-v1'

type ScaredStore = Record<string, ScaredSessionRecord[]>

async function readStore(): Promise<ScaredStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ScaredStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: ScaredStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadScaredSessions(patientCpf: string): Promise<ScaredSessionRecord[]> {
  const store = await readStore()
  return Array.isArray(store[patientCpf]) ? store[patientCpf] : []
}

export async function saveScaredSession(
  patientCpf: string,
  session: ScaredSessionRecord,
): Promise<ScaredSessionRecord[]> {
  const store = await readStore()
  const current = store[patientCpf] ?? []
  const next = [session, ...current.filter((item) => item.id !== session.id)]
  store[patientCpf] = next
  await writeStore(store)
  return next
}

export async function getScaredSession(
  patientCpf: string,
  sessionId: string,
): Promise<ScaredSessionRecord | null> {
  const sessions = await loadScaredSessions(patientCpf)
  return sessions.find((item) => item.id === sessionId) ?? null
}

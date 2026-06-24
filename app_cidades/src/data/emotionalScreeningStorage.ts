import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  emptyEmotionalScreeningStoreRecord,
  type EmotionalScreeningSessionRecord,
  type EmotionalScreeningStoreRecord,
} from '../types/emotionalScreening'

const STORAGE_KEY = '@telefarmed/emotional-screening-v1'

type EmotionalScreeningStore = Record<string, EmotionalScreeningStoreRecord>

async function readStore(): Promise<EmotionalScreeningStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as EmotionalScreeningStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: EmotionalScreeningStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadEmotionalScreeningRecord(
  patientCpf: string,
): Promise<EmotionalScreeningStoreRecord> {
  const store = await readStore()
  const record = store[patientCpf]
  if (!record || typeof record !== 'object') {
    return emptyEmotionalScreeningStoreRecord()
  }
  return {
    ...emptyEmotionalScreeningStoreRecord(),
    ...record,
    sessions: Array.isArray(record.sessions) ? record.sessions : [],
  }
}

export async function saveEmotionalScreeningSession(
  patientCpf: string,
  session: EmotionalScreeningSessionRecord,
): Promise<EmotionalScreeningStoreRecord> {
  const store = await readStore()
  const current = store[patientCpf] ?? emptyEmotionalScreeningStoreRecord()
  const next: EmotionalScreeningStoreRecord = {
    sessions: [session, ...current.sessions.filter((item) => item.id !== session.id)],
  }
  store[patientCpf] = next
  await writeStore(store)
  return next
}

export async function getEmotionalScreeningSession(
  patientCpf: string,
  sessionId: string,
): Promise<EmotionalScreeningSessionRecord | null> {
  const record = await loadEmotionalScreeningRecord(patientCpf)
  return record.sessions.find((session) => session.id === sessionId) ?? null
}

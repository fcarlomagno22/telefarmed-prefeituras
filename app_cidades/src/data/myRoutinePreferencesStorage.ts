import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  emptyMyRoutinePreferences,
  mergeMyRoutinePreferences,
  type MyRoutinePreferences,
} from '../types/myRoutine'

const STORAGE_KEY = '@telefarmed/my-routine-preferences'

type MyRoutinePreferencesStore = Record<string, MyRoutinePreferences>

async function readStore(): Promise<MyRoutinePreferencesStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as MyRoutinePreferencesStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: MyRoutinePreferencesStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function normalizePreferences(record: Partial<MyRoutinePreferences>): MyRoutinePreferences {
  return mergeMyRoutinePreferences(emptyMyRoutinePreferences(), record)
}

export async function loadMyRoutinePreferences(patientCpf: string): Promise<MyRoutinePreferences> {
  const store = await readStore()
  const record = store[patientCpf]

  if (!record || typeof record !== 'object') {
    return emptyMyRoutinePreferences()
  }

  return normalizePreferences(record)
}

export async function saveMyRoutinePreferences(
  patientCpf: string,
  preferences: MyRoutinePreferences,
) {
  const store = await readStore()
  store[patientCpf] = normalizePreferences(preferences)
  await writeStore(store)
}

export async function patchMyRoutinePreferences(
  patientCpf: string,
  patch: Partial<MyRoutinePreferences>,
): Promise<MyRoutinePreferences> {
  const current = await loadMyRoutinePreferences(patientCpf)
  const next = mergeMyRoutinePreferences(current, patch)
  await saveMyRoutinePreferences(patientCpf, next)
  return next
}

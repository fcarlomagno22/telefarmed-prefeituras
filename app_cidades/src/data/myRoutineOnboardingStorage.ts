import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  emptyMyRoutineOnboardingRecord,
  mergeMyRoutineOnboardingRecord,
  type MyRoutineOnboardingRecord,
} from '../types/myRoutine'

const STORAGE_KEY = '@telefarmed/my-routine-onboarding'

type MyRoutineOnboardingStore = Record<string, MyRoutineOnboardingRecord>

async function readStore(): Promise<MyRoutineOnboardingStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as MyRoutineOnboardingStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: MyRoutineOnboardingStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function normalizeOnboardingRecord(record: Partial<MyRoutineOnboardingRecord>): MyRoutineOnboardingRecord {
  return mergeMyRoutineOnboardingRecord(emptyMyRoutineOnboardingRecord(), record)
}

export async function loadMyRoutineOnboardingRecord(
  patientCpf: string,
): Promise<MyRoutineOnboardingRecord> {
  const store = await readStore()
  const record = store[patientCpf]

  if (!record || typeof record !== 'object') {
    return emptyMyRoutineOnboardingRecord()
  }

  return normalizeOnboardingRecord(record)
}

export async function saveMyRoutineOnboardingRecord(
  patientCpf: string,
  record: MyRoutineOnboardingRecord,
) {
  const store = await readStore()
  store[patientCpf] = normalizeOnboardingRecord(record)
  await writeStore(store)
}

export async function patchMyRoutineOnboardingRecord(
  patientCpf: string,
  patch: Partial<MyRoutineOnboardingRecord>,
): Promise<MyRoutineOnboardingRecord> {
  const current = await loadMyRoutineOnboardingRecord(patientCpf)
  const next = mergeMyRoutineOnboardingRecord(current, patch)
  await saveMyRoutineOnboardingRecord(patientCpf, next)
  return next
}

export async function completeMyRoutineOnboarding(
  patientCpf: string,
  record: MyRoutineOnboardingRecord,
) {
  await saveMyRoutineOnboardingRecord(patientCpf, {
    ...record,
    completed: true,
    completedAt: new Date().toISOString(),
  })
}

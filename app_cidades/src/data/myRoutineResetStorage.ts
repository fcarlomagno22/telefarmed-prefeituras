import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  emptyMyRoutineOnboardingRecord,
  type MyRoutineOnboardingRecord,
} from '../types/myRoutine'

const STORAGE_KEYS = [
  '@telefarmed/my-routine-onboarding',
  '@telefarmed/my-routine-week-plan',
  '@telefarmed/my-routine-daily',
  '@telefarmed/my-routine-day-closure',
  '@telefarmed/my-routine-day-history',
  '@telefarmed/my-routine-weekly-reviews',
  '@telefarmed/my-routine-preferences',
] as const

async function removePatientFromStore<T extends Record<string, unknown>>(
  storageKey: string,
  patientCpf: string,
) {
  try {
    const raw = await AsyncStorage.getItem(storageKey)
    if (!raw) return

    const store = JSON.parse(raw) as T
    if (!store || typeof store !== 'object') return

    if (!(patientCpf in store)) return

    delete store[patientCpf]
    await AsyncStorage.setItem(storageKey, JSON.stringify(store))
  } catch {
    // ignore corrupt stores during reset
  }
}

export async function clearMyRoutinePatientData(patientCpf: string) {
  await Promise.all(
    STORAGE_KEYS.map((key) => removePatientFromStore<Record<string, unknown>>(key, patientCpf)),
  )
}

export async function resetMyRoutineOnboardingOnly(patientCpf: string) {
  const storeRaw = await AsyncStorage.getItem('@telefarmed/my-routine-onboarding')
  if (!storeRaw) return emptyMyRoutineOnboardingRecord()

  const store = JSON.parse(storeRaw) as Record<string, MyRoutineOnboardingRecord>
  const current = store[patientCpf]
  if (!current) return emptyMyRoutineOnboardingRecord()

  const next = {
    ...current,
    completed: false,
    completedAt: null,
  }
  store[patientCpf] = next
  await AsyncStorage.setItem('@telefarmed/my-routine-onboarding', JSON.stringify(store))
  return next
}

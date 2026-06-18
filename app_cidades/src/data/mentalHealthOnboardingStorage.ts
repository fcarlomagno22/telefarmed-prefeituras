import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  emptyMentalHealthOnboardingRecord,
  type MentalHealthOnboardingRecord,
} from '../types/mentalHealth'

const STORAGE_KEY = '@telefarmed/mental-health-onboarding'

type MentalHealthOnboardingStore = Record<string, MentalHealthOnboardingRecord>

async function readStore(): Promise<MentalHealthOnboardingStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as MentalHealthOnboardingStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: MentalHealthOnboardingStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadMentalHealthOnboardingRecord(
  patientCpf: string,
): Promise<MentalHealthOnboardingRecord> {
  const store = await readStore()
  const record = store[patientCpf]

  if (!record || typeof record !== 'object') {
    return emptyMentalHealthOnboardingRecord()
  }

  return {
    ...emptyMentalHealthOnboardingRecord(),
    ...record,
    consents: {
      ...emptyMentalHealthOnboardingRecord().consents,
      ...record.consents,
    },
    preferences: {
      ...emptyMentalHealthOnboardingRecord().preferences,
      ...record.preferences,
    },
  }
}

export async function saveMentalHealthOnboardingRecord(
  patientCpf: string,
  record: MentalHealthOnboardingRecord,
) {
  const store = await readStore()
  store[patientCpf] = record
  await writeStore(store)
}

export async function completeMentalHealthOnboarding(
  patientCpf: string,
  record: MentalHealthOnboardingRecord,
) {
  await saveMentalHealthOnboardingRecord(patientCpf, {
    ...record,
    completed: true,
    completedAt: new Date().toISOString(),
  })
}

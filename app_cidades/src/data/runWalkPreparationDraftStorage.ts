import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ActivityModality } from '../types/auth'

const DRAFT_KEY = '@telefarmed/run-walk/preparation-draft'

export type PreparationDraft = {
  modality: ActivityModality
  activityName: string
  intensity: string
  durationMinutes: number
  audioConfigured: boolean
}

export async function savePreparationDraft(draft: PreparationDraft): Promise<void> {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

export async function loadPreparationDraft(): Promise<PreparationDraft | null> {
  const raw = await AsyncStorage.getItem(DRAFT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PreparationDraft
  } catch {
    return null
  }
}

export async function clearPreparationDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY)
}

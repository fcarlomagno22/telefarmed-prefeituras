import AsyncStorage from '@react-native-async-storage/async-storage'
import { BloodPressureHistoryEntry } from '../types/bloodPressure'
import {
  createMockBloodPressureHistory,
  registerBloodPressureInHistory,
} from './mockBloodPressureHistory'

const BLOOD_PRESSURE_HISTORY_KEY = '@telefarmed/blood-pressure-history'

export async function loadBloodPressureHistory(): Promise<BloodPressureHistoryEntry[]> {
  const fallback = createMockBloodPressureHistory()

  try {
    const raw = await AsyncStorage.getItem(BLOOD_PRESSURE_HISTORY_KEY)
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as BloodPressureHistoryEntry[]
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback

    return parsed
  } catch {
    return fallback
  }
}

export async function saveBloodPressureHistory(history: BloodPressureHistoryEntry[]) {
  await AsyncStorage.setItem(BLOOD_PRESSURE_HISTORY_KEY, JSON.stringify(history))
}

export function appendBloodPressureReading(
  history: BloodPressureHistoryEntry[],
  systolic: number,
  diastolic: number,
  at: Date = new Date(),
) {
  return registerBloodPressureInHistory(history, systolic, diastolic, at)
}

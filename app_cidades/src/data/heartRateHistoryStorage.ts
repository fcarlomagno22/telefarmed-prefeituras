import AsyncStorage from '@react-native-async-storage/async-storage'
import { HeartRateReading } from '../types/heartRate'
import { deserializeHeartRateReading, serializeHeartRateReading } from '../utils/heartRate'
import {
  createExtendedMockHeartRateHistory,
  registerHeartRateInHistory,
} from './mockHeartRateHistory'

const HEART_RATE_HISTORY_KEY = '@telefarmed/heart-rate-history'

type StoredHeartRateReading = ReturnType<typeof serializeHeartRateReading>

export async function loadHeartRateHistory(): Promise<HeartRateReading[]> {
  const fallback = createExtendedMockHeartRateHistory()

  try {
    const raw = await AsyncStorage.getItem(HEART_RATE_HISTORY_KEY)
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as StoredHeartRateReading[]
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback

    return parsed.map(deserializeHeartRateReading)
  } catch {
    return fallback
  }
}

export async function saveHeartRateHistory(history: HeartRateReading[]) {
  const payload = history.map(serializeHeartRateReading)
  await AsyncStorage.setItem(HEART_RATE_HISTORY_KEY, JSON.stringify(payload))
}

export function appendHeartRateReading(
  history: HeartRateReading[],
  reading: HeartRateReading,
) {
  return registerHeartRateInHistory(history, reading)
}

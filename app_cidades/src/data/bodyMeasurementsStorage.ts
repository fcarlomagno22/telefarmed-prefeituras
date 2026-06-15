import AsyncStorage from '@react-native-async-storage/async-storage'
import { createInitialBodyMeasurementHistory } from './bodyMeasurements'
import { BodyMeasurementHistory } from '../types/bodyMeasurements'

const BODY_MEASUREMENTS_KEY = '@telefarmed/body-measurements'

export async function loadBodyMeasurementHistory(): Promise<BodyMeasurementHistory> {
  const fallback = createInitialBodyMeasurementHistory()

  try {
    const raw = await AsyncStorage.getItem(BODY_MEASUREMENTS_KEY)
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as BodyMeasurementHistory
    if (!parsed || typeof parsed !== 'object') return fallback

    return { ...fallback, ...parsed }
  } catch {
    return fallback
  }
}

export async function saveBodyMeasurementHistory(history: BodyMeasurementHistory) {
  await AsyncStorage.setItem(BODY_MEASUREMENTS_KEY, JSON.stringify(history))
}

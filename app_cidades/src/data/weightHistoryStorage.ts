import AsyncStorage from '@react-native-async-storage/async-storage'
import { MetricDataPoint, ProfileSnapshot } from '../types/metrics'
import { createInitialWeightHistory, ensureSevenDayWeightHistory } from './mockHealthMetrics'

const WEIGHT_HISTORY_KEY = '@telefarmed/weight-history'

export async function loadWeightHistory(profile: ProfileSnapshot): Promise<MetricDataPoint[]> {
  const fallback = createInitialWeightHistory(profile)

  try {
    const raw = await AsyncStorage.getItem(WEIGHT_HISTORY_KEY)
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as MetricDataPoint[]
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback

    return ensureSevenDayWeightHistory(parsed, profile)
  } catch {
    return fallback
  }
}

export async function saveWeightHistory(history: MetricDataPoint[]) {
  await AsyncStorage.setItem(WEIGHT_HISTORY_KEY, JSON.stringify(history))
}

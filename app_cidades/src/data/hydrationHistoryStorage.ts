import AsyncStorage from '@react-native-async-storage/async-storage'
import { HydrationDayRecord } from '../types/hydration'
import { appendHydrationLog, createExtendedMockHydrationHistory } from './mockHydrationHistory'

const HYDRATION_HISTORY_KEY = '@telefarmed/hydration-history'

export async function loadHydrationHistory(): Promise<HydrationDayRecord[]> {
  const fallback = createExtendedMockHydrationHistory()

  try {
    const raw = await AsyncStorage.getItem(HYDRATION_HISTORY_KEY)
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as HydrationDayRecord[]
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback

    return parsed
  } catch {
    return fallback
  }
}

export async function saveHydrationHistory(history: HydrationDayRecord[]) {
  await AsyncStorage.setItem(HYDRATION_HISTORY_KEY, JSON.stringify(history))
}

export function registerHydrationLog(history: HydrationDayRecord[], amountMl: number, at?: Date) {
  return appendHydrationLog(history, amountMl, at)
}

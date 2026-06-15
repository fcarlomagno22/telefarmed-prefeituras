import AsyncStorage from '@react-native-async-storage/async-storage'
import { GlucoseHistoryEntry, GlucoseReadingContext } from '../types/glucose'
import { createMockGlucoseHistory, registerGlucoseInHistory } from './mockGlucoseHistory'

const GLUCOSE_HISTORY_KEY = '@telefarmed/glucose-history'

export async function loadGlucoseHistory(): Promise<GlucoseHistoryEntry[]> {
  const fallback = createMockGlucoseHistory()

  try {
    const raw = await AsyncStorage.getItem(GLUCOSE_HISTORY_KEY)
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as GlucoseHistoryEntry[]
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback

    return parsed
  } catch {
    return fallback
  }
}

export async function saveGlucoseHistory(history: GlucoseHistoryEntry[]) {
  await AsyncStorage.setItem(GLUCOSE_HISTORY_KEY, JSON.stringify(history))
}

export function appendGlucoseReading(
  history: GlucoseHistoryEntry[],
  amountMg: number,
  context: GlucoseReadingContext,
  at: Date = new Date(),
) {
  return registerGlucoseInHistory(history, amountMg, context, at)
}

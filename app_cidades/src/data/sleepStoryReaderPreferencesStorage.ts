import AsyncStorage from '@react-native-async-storage/async-storage'

const FONT_SIZE_KEY = '@telefarmed/sleep-story-font-size'

export const SLEEP_STORY_FONT_MIN = 15
export const SLEEP_STORY_FONT_MAX = 26
export const SLEEP_STORY_FONT_STEP = 1
export const SLEEP_STORY_FONT_DEFAULT = 18

export async function loadSleepStoryFontSize(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(FONT_SIZE_KEY)
    if (!raw) return SLEEP_STORY_FONT_DEFAULT
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return SLEEP_STORY_FONT_DEFAULT
    return Math.min(SLEEP_STORY_FONT_MAX, Math.max(SLEEP_STORY_FONT_MIN, parsed))
  } catch {
    return SLEEP_STORY_FONT_DEFAULT
  }
}

export async function saveSleepStoryFontSize(size: number) {
  const clamped = Math.min(SLEEP_STORY_FONT_MAX, Math.max(SLEEP_STORY_FONT_MIN, size))
  await AsyncStorage.setItem(FONT_SIZE_KEY, String(clamped))
  return clamped
}

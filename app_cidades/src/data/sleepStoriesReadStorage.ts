import AsyncStorage from '@react-native-async-storage/async-storage'
import type { SleepStoryId } from '../types/sleepStories'

const STORAGE_KEY = '@telefarmed/sleep-stories-read'

export async function loadReadSleepStoryIds(): Promise<Set<SleepStoryId>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()

    return new Set(parsed.filter((id): id is SleepStoryId => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

export async function saveReadSleepStoryIds(ids: Set<SleepStoryId>) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export async function setSleepStoryRead(
  storyId: SleepStoryId,
  read: boolean,
  current: Set<SleepStoryId>,
): Promise<Set<SleepStoryId>> {
  const next = new Set(current)
  if (read) {
    next.add(storyId)
  } else {
    next.delete(storyId)
  }
  await saveReadSleepStoryIds(next)
  return next
}

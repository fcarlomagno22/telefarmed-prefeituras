import AsyncStorage from '@react-native-async-storage/async-storage'

const LIKES_KEY = '@telefarmed/bible-verse-likes'
const FONT_SIZE_KEY = '@telefarmed/bible-verse-font-size'

export const BIBLE_VERSE_FONT_MIN = 13
export const BIBLE_VERSE_FONT_MAX = 24
export const BIBLE_VERSE_FONT_DEFAULT = 16

export function buildBibleVerseLikeKey(bookAbbrev: string, chapter: number, verse: number) {
  return `${bookAbbrev.toLowerCase()}:${chapter}:${verse}`
}

export async function loadBibleVerseFontSize(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(FONT_SIZE_KEY)
    if (!raw) return BIBLE_VERSE_FONT_DEFAULT
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return BIBLE_VERSE_FONT_DEFAULT
    return Math.min(BIBLE_VERSE_FONT_MAX, Math.max(BIBLE_VERSE_FONT_MIN, parsed))
  } catch {
    return BIBLE_VERSE_FONT_DEFAULT
  }
}

export async function saveBibleVerseFontSize(size: number) {
  const clamped = Math.min(BIBLE_VERSE_FONT_MAX, Math.max(BIBLE_VERSE_FONT_MIN, size))
  await AsyncStorage.setItem(FONT_SIZE_KEY, String(clamped))
  return clamped
}

async function readAllLikes(): Promise<Record<string, string[]>> {
  try {
    const raw = await AsyncStorage.getItem(LIKES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string[]>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export async function loadBibleVerseLikes(patientCpf: string): Promise<Set<string>> {
  const all = await readAllLikes()
  const list = all[patientCpf]
  return new Set(Array.isArray(list) ? list : [])
}

export async function toggleBibleVerseLike(
  patientCpf: string,
  likeKey: string,
): Promise<{ liked: boolean; likes: Set<string> }> {
  const all = await readAllLikes()
  const current = new Set(Array.isArray(all[patientCpf]) ? all[patientCpf] : [])
  const liked = !current.has(likeKey)

  if (liked) {
    current.add(likeKey)
  } else {
    current.delete(likeKey)
  }

  all[patientCpf] = [...current]
  await AsyncStorage.setItem(LIKES_KEY, JSON.stringify(all))
  return { liked, likes: current }
}

export async function addBibleVerseLike(patientCpf: string, likeKey: string): Promise<Set<string>> {
  const all = await readAllLikes()
  const current = new Set(Array.isArray(all[patientCpf]) ? all[patientCpf] : [])
  current.add(likeKey)
  all[patientCpf] = [...current]
  await AsyncStorage.setItem(LIKES_KEY, JSON.stringify(all))
  return current
}

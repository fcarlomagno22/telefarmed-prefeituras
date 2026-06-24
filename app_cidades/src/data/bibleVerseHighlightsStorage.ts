import AsyncStorage from '@react-native-async-storage/async-storage'
import type { BibleHighlightColorId, BibleVerseHighlight } from '../types/bibleHighlights'
import { highlightsOverlap } from '../utils/bibleHighlightSegments'

const HIGHLIGHTS_KEY = '@telefarmed/bible-verse-highlights'

async function readAllHighlights(): Promise<Record<string, BibleVerseHighlight[]>> {
  try {
    const raw = await AsyncStorage.getItem(HIGHLIGHTS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, BibleVerseHighlight[]>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeAllHighlights(all: Record<string, BibleVerseHighlight[]>) {
  await AsyncStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(all))
}

export async function loadAllBibleVerseHighlights(patientCpf: string): Promise<BibleVerseHighlight[]> {
  const all = await readAllHighlights()
  const list = all[patientCpf]
  return Array.isArray(list) ? list : []
}

export async function loadBibleChapterHighlights(
  patientCpf: string,
  bookAbbrev: string,
  chapter: number,
): Promise<BibleVerseHighlight[]> {
  const all = await readAllHighlights()
  const list = all[patientCpf]
  if (!Array.isArray(list)) return []

  const normalizedAbbrev = bookAbbrev.toLowerCase()
  return list.filter(
    (item) => item.bookAbbrev.toLowerCase() === normalizedAbbrev && item.chapter === chapter,
  )
}

export async function saveBibleVerseHighlight(
  patientCpf: string,
  highlight: BibleVerseHighlight,
): Promise<BibleVerseHighlight[]> {
  const all = await readAllHighlights()
  const current = Array.isArray(all[patientCpf]) ? all[patientCpf] : []

  const sameVerse = current.filter(
    (item) =>
      item.bookAbbrev.toLowerCase() === highlight.bookAbbrev.toLowerCase() &&
      item.chapter === highlight.chapter &&
      item.verse === highlight.verse &&
      item.id !== highlight.id,
  )

  if (sameVerse.some((item) => highlightsOverlap(item, highlight))) {
    throw new Error('Este trecho sobrepõe outro grifo neste versículo.')
  }

  const next = [...current.filter((item) => item.id !== highlight.id), highlight]
  all[patientCpf] = next
  await writeAllHighlights(all)
  return next.filter(
    (item) =>
      item.bookAbbrev.toLowerCase() === highlight.bookAbbrev.toLowerCase() &&
      item.chapter === highlight.chapter,
  )
}

export async function deleteBibleVerseHighlight(
  patientCpf: string,
  highlightId: string,
  bookAbbrev: string,
  chapter: number,
): Promise<BibleVerseHighlight[]> {
  const all = await readAllHighlights()
  const current = Array.isArray(all[patientCpf]) ? all[patientCpf] : []
  const normalizedAbbrev = bookAbbrev.toLowerCase()

  all[patientCpf] = current.filter((item) => item.id !== highlightId)
  await writeAllHighlights(all)

  return all[patientCpf].filter(
    (item) => item.bookAbbrev.toLowerCase() === normalizedAbbrev && item.chapter === chapter,
  )
}

export function createBibleVerseHighlightId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function buildHighlightFromSelection(input: {
  id?: string
  bookAbbrev: string
  chapter: number
  verse: number
  start: number
  end: number
  colorId: BibleHighlightColorId
  comment?: string
}): BibleVerseHighlight {
  return {
    id: input.id ?? createBibleVerseHighlightId(),
    bookAbbrev: input.bookAbbrev.toLowerCase(),
    chapter: input.chapter,
    verse: input.verse,
    start: input.start,
    end: input.end,
    colorId: input.colorId,
    comment: input.comment?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  }
}

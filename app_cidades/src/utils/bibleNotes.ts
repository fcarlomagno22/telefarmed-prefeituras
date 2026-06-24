import {
  formatBibleVerseReference,
  getBibleBookByAbbrev,
  getBibleVerse,
} from '../data/bibleCatalog'
import type { BibleHighlightColorId, BibleVerseHighlight } from '../types/bibleHighlights'

export type ResolvedBibleNote = {
  highlight: BibleVerseHighlight
  bookName: string
  reference: string
  highlightedText: string
  verseText: string
  hasComment: boolean
}

function normalizeBibleNotesSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export function resolveBibleNotes(highlights: BibleVerseHighlight[]): ResolvedBibleNote[] {
  return highlights
    .map((highlight) => {
      const book = getBibleBookByAbbrev(highlight.bookAbbrev)
      const verse = getBibleVerse(highlight.bookAbbrev, highlight.chapter, highlight.verse)
      const verseText = verse?.text ?? ''
      const highlightedText = verseText.slice(highlight.start, highlight.end).trim() || verseText.trim()
      const bookName = book?.name ?? highlight.bookAbbrev.toUpperCase()

      return {
        highlight,
        bookName,
        reference: formatBibleVerseReference(bookName, highlight.chapter, highlight.verse),
        highlightedText,
        verseText,
        hasComment: Boolean(highlight.comment?.trim()),
      }
    })
    .sort((a, b) => b.highlight.updatedAt.localeCompare(a.highlight.updatedAt))
}

export function filterBibleNotes(
  notes: ResolvedBibleNote[],
  search: string,
  colorId: BibleHighlightColorId | 'all',
) {
  const query = normalizeBibleNotesSearch(search)

  return notes.filter((note) => {
    if (colorId !== 'all' && note.highlight.colorId !== colorId) return false
    if (!query) return true

    const haystack = normalizeBibleNotesSearch(
      [
        note.reference,
        note.bookName,
        note.highlightedText,
        note.highlight.comment ?? '',
        note.verseText,
      ].join(' '),
    )

    return haystack.includes(query)
  })
}

export function formatBibleNoteDate(isoDate: string) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

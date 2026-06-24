import { getBibleVerse } from '../data/bibleCatalog'
import type { PeaceWordsPhrase } from '../types/peaceWordsPhrases'

export function buildBibleVerseScopeKey(bookAbbrev: string, chapter: number, verse: number) {
  return `${bookAbbrev.toLowerCase()}:${chapter}:${verse}`
}

export function resolvePeaceWordsPhraseVerses(phrase: PeaceWordsPhrase) {
  return phrase.versiculos.map((entry) => {
    const fromBible = getBibleVerse(phrase.abreviacao, phrase.capitulo, entry.verse)
    return {
      bookAbbrev: phrase.abreviacao,
      chapter: phrase.capitulo,
      verse: entry.verse,
      text: fromBible?.text ?? entry.text,
    }
  })
}

export function filterHighlightsForVerse<
  T extends { bookAbbrev: string; chapter: number; verse: number },
>(highlights: T[], bookAbbrev: string, chapter: number, verse: number) {
  const normalizedAbbrev = bookAbbrev.toLowerCase()
  return highlights.filter(
    (item) =>
      item.bookAbbrev.toLowerCase() === normalizedAbbrev &&
      item.chapter === chapter &&
      item.verse === verse,
  )
}

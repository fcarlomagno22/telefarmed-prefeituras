import type { BibleBook } from '../types/bible'
import { BIBLE_NEW_TESTAMENT_START_INDEX } from '../types/bible'

const bibleData = require('../../assets/biblia/biblia.json') as BibleBook[]

export function getBibleBooks() {
  return bibleData
}

export function getBibleBookByAbbrev(abbrev: string) {
  const normalized = abbrev.trim().toLowerCase()
  return bibleData.find((book) => book.abbrev.toLowerCase() === normalized) ?? null
}

export function isBibleNewTestamentBook(book: BibleBook) {
  const index = bibleData.findIndex((entry) => entry.abbrev === book.abbrev)
  return index >= BIBLE_NEW_TESTAMENT_START_INDEX
}

export const BIBLE_TESTAMENT_COLORS = {
  old: '#d97706',
  new: '#67e8f9',
} as const

export function groupBibleBooksByTestament() {
  return {
    old: bibleData.slice(0, BIBLE_NEW_TESTAMENT_START_INDEX),
    new: bibleData.slice(BIBLE_NEW_TESTAMENT_START_INDEX),
  }
}

export function getBibleChapterVerses(book: BibleBook, chapterNumber: number) {
  const chapterIndex = chapterNumber - 1
  if (chapterIndex < 0 || chapterIndex >= book.chapters.length) return []
  return book.chapters[chapterIndex] ?? []
}

export function formatBibleChapterReference(bookName: string, chapterNumber: number) {
  return `${bookName} ${chapterNumber}`
}

export function getBibleVerse(bookAbbrev: string, chapterNumber: number, verseNumber: number) {
  const book = getBibleBookByAbbrev(bookAbbrev)
  if (!book) return null

  const verses = getBibleChapterVerses(book, chapterNumber)
  return verses.find((entry) => entry.verse === verseNumber) ?? null
}

export function formatBibleVerseReference(
  bookName: string,
  chapterNumber: number,
  verseNumber: number,
) {
  return `${bookName} ${chapterNumber}:${verseNumber}`
}

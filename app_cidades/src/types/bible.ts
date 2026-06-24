export type BibleVerse = {
  verse: number
  text: string
}

export type BibleBook = {
  abbrev: string
  name: string
  chapters: BibleVerse[][]
}

export type BibleTab = 'holy-bible' | 'peace-words' | 'notes'

export const BIBLE_NEW_TESTAMENT_START_INDEX = 39

/** Oculta a aba Palavras de Paz na UI sem remover código ou rotas. */
export const BIBLE_PEACE_WORDS_TAB_VISIBLE = false

export const BIBLE_SEGMENT_TABS: {
  id: BibleTab
  label: string
  available: true
  visible?: boolean
}[] = [
  { id: 'holy-bible', label: 'Bíblia Sagrada', available: true },
  { id: 'peace-words', label: 'Palavras de Paz', available: true, visible: BIBLE_PEACE_WORDS_TAB_VISIBLE },
  { id: 'notes', label: 'Anotações', available: true },
]

export const BIBLE_SEGMENT_PAGES: BibleTab[] = BIBLE_SEGMENT_TABS.map((tab) => tab.id)

export const BIBLE_VISIBLE_SEGMENT_TABS = BIBLE_SEGMENT_TABS.filter((tab) => tab.visible !== false)

export const BIBLE_VISIBLE_SEGMENT_PAGES: BibleTab[] = BIBLE_VISIBLE_SEGMENT_TABS.map((tab) => tab.id)

export function resolveVisibleBibleSegmentTab(tab: BibleTab | undefined): BibleTab {
  const fallback = BIBLE_VISIBLE_SEGMENT_PAGES[0] ?? 'holy-bible'
  if (!tab || !BIBLE_VISIBLE_SEGMENT_PAGES.includes(tab)) return fallback
  return tab
}

export const BIBLE_UNDER_CONSTRUCTION_COPY: Record<
  Exclude<BibleTab, 'holy-bible' | 'peace-words'>,
  { title: string; subtitle: string }
> = {
  notes: {
    title: 'Anotações',
    subtitle: 'Em breve você poderá registrar reflexões e versículos marcados.',
  },
}

export type BibleRouteParams = {
  bookAbbrev?: string
  chapter?: number
  verse?: number
  segmentTab?: BibleTab
  peaceWordsExpandedCategoryId?: string
}

export type PeaceWordsRouteParams = {
  topicId?: string
}

export type BibleVerseRef = {
  abbrev: string
  chapter: number
  verse: number
}

export type PeaceWordsTopic = {
  id: string
  label: string
  verses?: BibleVerseRef[]
  phrasesFile?: string
}

export type PeaceWordsCategory = {
  id: string
  title: string
  accent: string
  accentSoft: string
  topics: PeaceWordsTopic[]
}

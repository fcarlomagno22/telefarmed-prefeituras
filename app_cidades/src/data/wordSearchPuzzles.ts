import type { ActiveMindPlayDifficulty } from '../types/activeMind'
import type { WordSearchEntry, WordSearchSession } from '../types/wordSearch'
import {
  buildWordSearchPuzzleId,
  generateWordSearch,
  type WordSearchWordInput,
} from '../utils/wordSearchGenerator'

type WordSearchBankWord = {
  id?: number
  palavra?: string
  palavra_grid?: string
  dica?: string
}

type WordSearchBank = {
  palavras?: WordSearchBankWord[]
}

const WORD_SEARCH_BANKS: Record<ActiveMindPlayDifficulty, WordSearchBank> = {
  facil: require('../../assets/palavras_cruzadas_facil.json'),
  medio: require('../../assets/palavras_cruzadas_medio.json'),
  dificil: require('../../assets/palavras_cruzadas_dificil.json'),
}

function parseWordSearchEntry(entry: WordSearchBankWord): WordSearchWordInput | null {
  const word = String(entry.palavra_grid ?? '').trim().toUpperCase()
  if (!word) return null

  const hint = String(entry.dica ?? '').trim()
  if (!hint) return null

  return {
    id: entry.id,
    word,
    hint,
  }
}

function getWordPool(difficulty: ActiveMindPlayDifficulty): WordSearchWordInput[] {
  const seen = new Set<string>()
  const words: WordSearchWordInput[] = []
  const bank = WORD_SEARCH_BANKS[difficulty]

  for (const item of bank.palavras ?? []) {
    const parsed = parseWordSearchEntry(item)
    if (!parsed) continue
    if (seen.has(parsed.word)) continue

    seen.add(parsed.word)
    words.push(parsed)
  }

  return words
}

export function createWordSearchSession(
  difficulty: ActiveMindPlayDifficulty,
  excludeId?: string,
  seedOffset = 0,
): WordSearchSession {
  const pool = getWordPool(difficulty)
  let attempt = seedOffset

  while (attempt < seedOffset + 80) {
    const generated = generateWordSearch(pool, difficulty, attempt)
    attempt += 1

    if (!generated) continue

    const puzzleId = buildWordSearchPuzzleId(difficulty, generated.entries)
    if (excludeId && puzzleId === excludeId) continue

    return {
      puzzleId,
      difficulty,
      rows: generated.rows,
      cols: generated.cols,
      entries: generated.entries,
      cells: generated.cells,
      foundEntryIds: new Set<string>(),
    }
  }

  const fallback = generateWordSearch(pool, difficulty, 0)
  if (!fallback) {
    throw new Error('Não foi possível gerar um caça-palavras.')
  }

  return {
    puzzleId: buildWordSearchPuzzleId(difficulty, fallback.entries),
    difficulty,
    rows: fallback.rows,
    cols: fallback.cols,
    entries: fallback.entries,
    cells: fallback.cells,
    foundEntryIds: new Set<string>(),
  }
}

export function findWordSearchEntryForSelection(
  session: WordSearchSession,
  cellKeys: readonly string[],
): WordSearchEntry | null {
  if (cellKeys.length < 2) return null

  const selected = new Set(cellKeys)

  for (const entry of session.entries) {
    if (session.foundEntryIds.has(entry.id)) continue
    if (entry.cellKeys.length !== cellKeys.length) continue
    if (entry.cellKeys.every((key) => selected.has(key))) {
      return entry
    }
  }

  return null
}

export function markWordSearchEntryFound(
  session: WordSearchSession,
  entryId: string,
): WordSearchSession {
  const foundEntryIds = new Set(session.foundEntryIds)
  foundEntryIds.add(entryId)

  return {
    ...session,
    foundEntryIds,
  }
}

export function isWordSearchSolved(session: WordSearchSession): boolean {
  return session.foundEntryIds.size >= session.entries.length
}

export function getWordSearchFoundCellKeys(session: WordSearchSession): Set<string> {
  const keys = new Set<string>()

  for (const entry of session.entries) {
    if (!session.foundEntryIds.has(entry.id)) continue
    for (const key of entry.cellKeys) {
      keys.add(key)
    }
  }

  return keys
}

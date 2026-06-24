import type { ActiveMindPlayDifficulty } from '../types/activeMind'
import type { CrosswordDirection, CrosswordEntry, CrosswordSession } from '../types/crossword'
import {
  buildCrosswordPuzzleId,
  filterCrosswordCandidates,
  generateCrossword,
  type CrosswordWordInput,
} from '../utils/crosswordGenerator'
import { normalizeWordAnswer } from '../utils/formTheWordChunks'

type CrosswordBankWord = {
  id?: number
  palavra?: string
  palavra_grid?: string
  dica?: string
}

type CrosswordBank = {
  palavras?: CrosswordBankWord[]
}

const CROSSWORD_BANKS: Record<ActiveMindPlayDifficulty, CrosswordBank> = {
  facil: require('../../assets/palavras_cruzadas_facil.json'),
  medio: require('../../assets/palavras_cruzadas_medio.json'),
  dificil: require('../../assets/palavras_cruzadas_dificil.json'),
}

function parseCrosswordEntry(entry: CrosswordBankWord): CrosswordWordInput | null {
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

function getWordPool(difficulty: ActiveMindPlayDifficulty): CrosswordWordInput[] {
  const seen = new Set<string>()
  const words: CrosswordWordInput[] = []
  const bank = CROSSWORD_BANKS[difficulty]

  for (const item of bank.palavras ?? []) {
    const parsed = parseCrosswordEntry(item)
    if (!parsed) continue

    if (seen.has(parsed.word)) continue

    seen.add(parsed.word)
    words.push(parsed)
  }

  return words
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`
}

function getCell(session: CrosswordSession, row: number, col: number) {
  return session.cells[cellKey(row, col)]
}

export function isCrosswordPlayableCell(session: CrosswordSession, row: number, col: number): boolean {
  const cell = getCell(session, row, col)
  return Boolean(cell && !cell.isBlock)
}

export function isCrosswordCellLockedByOtherSolvedEntry(
  session: CrosswordSession,
  row: number,
  col: number,
  activeEntryId?: string | null,
): boolean {
  const key = cellKey(row, col)
  return session.entries.some(
    (entry) =>
      entry.id !== activeEntryId &&
      session.solvedEntryIds.has(entry.id) &&
      entry.cellKeys.includes(key),
  )
}

export function createCrosswordSession(
  difficulty: ActiveMindPlayDifficulty,
  excludeId?: string,
  seedOffset = 0,
): CrosswordSession {
  const pool = getWordPool(difficulty)
  let attempt = seedOffset

  while (attempt < seedOffset + 80) {
    const generated = generateCrossword(pool, difficulty, attempt)
    attempt += 1

    if (!generated) continue

    const puzzleId = buildCrosswordPuzzleId(difficulty, generated.entries)
    if (excludeId && puzzleId === excludeId) continue

    return {
      puzzleId,
      difficulty,
      rows: generated.rows,
      cols: generated.cols,
      rowOffset: generated.rowOffset,
      colOffset: generated.colOffset,
      entries: generated.entries,
      cells: Object.fromEntries(
        Object.entries(generated.cells).map(([key, cell]) => [
          key,
          { ...cell, user: '' },
        ]),
      ),
      solvedEntryIds: new Set<string>(),
    }
  }

  const fallbackWords = filterCrosswordCandidates(pool, difficulty).slice(0, 24)
  const generated = generateCrossword(fallbackWords, difficulty, 0)

  if (!generated) {
    throw new Error('Não foi possível gerar uma cruzada.')
  }

  return {
    puzzleId: buildCrosswordPuzzleId(difficulty, generated.entries),
    difficulty,
    rows: generated.rows,
    cols: generated.cols,
    rowOffset: generated.rowOffset,
    colOffset: generated.colOffset,
    entries: generated.entries,
    cells: Object.fromEntries(
      Object.entries(generated.cells).map(([key, cell]) => [key, { ...cell, user: '' }]),
    ),
    solvedEntryIds: new Set<string>(),
  }
}

export function getCrosswordEntryAtCell(
  session: CrosswordSession,
  row: number,
  col: number,
  direction: CrosswordDirection,
): CrosswordEntry | undefined {
  if (!isCrosswordPlayableCell(session, row, col)) return undefined

  const key = cellKey(row, col)
  return session.entries.find(
    (entry) => entry.direction === direction && entry.cellKeys.includes(key),
  )
}

export function getCrosswordEntriesAtCell(
  session: CrosswordSession,
  row: number,
  col: number,
): CrosswordEntry[] {
  if (!isCrosswordPlayableCell(session, row, col)) return []

  const key = cellKey(row, col)
  return session.entries.filter((entry) => entry.cellKeys.includes(key))
}

export function getCrosswordEntriesStartingAtCell(
  session: CrosswordSession,
  row: number,
  col: number,
): CrosswordEntry[] {
  if (!isCrosswordPlayableCell(session, row, col)) return []

  const key = cellKey(row, col)
  return session.entries.filter((entry) => entry.cellKeys[0] === key)
}

export function getCrosswordEntryCells(session: CrosswordSession, entryId: string): string[] {
  return session.entries.find((entry) => entry.id === entryId)?.cellKeys ?? []
}

export function isCrosswordCellSolved(session: CrosswordSession, row: number, col: number): boolean {
  const cell = getCell(session, row, col)
  if (!cell || cell.isBlock) return false
  return normalizeWordAnswer(cell.user) === normalizeWordAnswer(cell.solution)
}

export function isCrosswordEntryComplete(session: CrosswordSession, entryId: string): boolean {
  const entry = session.entries.find((item) => item.id === entryId)
  if (!entry) return false

  return entry.cellKeys.every((key) => {
    const cell = session.cells[key]
    return Boolean(cell && !cell.isBlock && cell.user)
  })
}

export function isCrosswordEntryCorrect(session: CrosswordSession, entryId: string): boolean {
  const entry = session.entries.find((item) => item.id === entryId)
  if (!entry) return false

  return entry.cellKeys.every((key) => {
    const cell = session.cells[key]
    if (!cell || cell.isBlock || !cell.user) return false
    return normalizeWordAnswer(cell.user) === normalizeWordAnswer(cell.solution)
  })
}

export function isCrosswordSolved(session: CrosswordSession): boolean {
  return session.entries.every((entry) => session.solvedEntryIds.has(entry.id))
}

export function setCrosswordCellValue(
  session: CrosswordSession,
  row: number,
  col: number,
  value: string,
): CrosswordSession {
  const key = cellKey(row, col)
  const cell = session.cells[key]
  if (!cell || cell.isBlock) return session

  return {
    ...session,
    cells: {
      ...session.cells,
      [key]: {
        ...cell,
        user: value,
      },
    },
  }
}

export function clearCrosswordCell(session: CrosswordSession, row: number, col: number): CrosswordSession {
  return setCrosswordCellValue(session, row, col, '')
}

export function hasCrosswordEntryClearableInput(session: CrosswordSession, entryId: string): boolean {
  const entry = session.entries.find((item) => item.id === entryId)
  if (!entry || session.solvedEntryIds.has(entryId)) return false

  return entry.cellKeys.some((key) => {
    const cell = session.cells[key]
    if (!cell || cell.isBlock || !cell.user) return false

    const lockedBySolvedEntry = session.entries.some(
      (other) =>
        other.id !== entryId &&
        session.solvedEntryIds.has(other.id) &&
        other.cellKeys.includes(key),
    )
    if (lockedBySolvedEntry) return false

    return normalizeWordAnswer(cell.user) !== normalizeWordAnswer(cell.solution)
  })
}

export function getNextCrosswordCellInEntry(
  session: CrosswordSession,
  entryId: string,
  row: number,
  col: number,
  step: 1 | -1,
): { row: number; col: number } | null {
  const entry = session.entries.find((item) => item.id === entryId)
  if (!entry) return null

  const key = cellKey(row, col)
  const index = entry.cellKeys.indexOf(key)
  if (index === -1) return null

  const nextKey = entry.cellKeys[index + step]
  if (!nextKey) return null

  const [nextRow, nextCol] = nextKey.split(',').map(Number)
  if (!isCrosswordPlayableCell(session, nextRow, nextCol)) return null

  return { row: nextRow, col: nextCol }
}

export function markCrosswordEntrySolved(session: CrosswordSession, entryId: string): CrosswordSession {
  const nextSolved = new Set(session.solvedEntryIds)
  nextSolved.add(entryId)

  const entry = session.entries.find((item) => item.id === entryId)
  if (!entry) return { ...session, solvedEntryIds: nextSolved }

  const nextCells = { ...session.cells }
  for (const key of entry.cellKeys) {
    const cell = nextCells[key]
    if (!cell || cell.isBlock) continue
    nextCells[key] = {
      ...cell,
      user: cell.solution,
    }
  }

  return {
    ...session,
    cells: nextCells,
    solvedEntryIds: nextSolved,
  }
}

export function revealCrosswordCell(session: CrosswordSession, row: number, col: number): CrosswordSession {
  const key = cellKey(row, col)
  const cell = session.cells[key]
  if (!cell || cell.isBlock) return session

  return setCrosswordCellValue(session, row, col, cell.solution)
}

export function revealCrosswordEntry(session: CrosswordSession, entryId: string): CrosswordSession {
  const entry = session.entries.find((item) => item.id === entryId)
  if (!entry) return session

  let nextSession = session
  for (const key of entry.cellKeys) {
    const [row, col] = key.split(',').map(Number)
    nextSession = revealCrosswordCell(nextSession, row, col)
  }

  const nextSolved = new Set(nextSession.solvedEntryIds)
  nextSolved.add(entryId)

  return {
    ...nextSession,
    solvedEntryIds: nextSolved,
  }
}

export function clearCrosswordEntryInput(session: CrosswordSession, entryId: string): CrosswordSession {
  const entry = session.entries.find((item) => item.id === entryId)
  if (!entry) return session

  let nextSession = session
  for (const key of entry.cellKeys) {
    const cell = session.cells[key]
    if (!cell || cell.isBlock || !cell.user) continue

    const lockedBySolvedEntry = session.entries.some(
      (other) =>
        other.id !== entryId &&
        session.solvedEntryIds.has(other.id) &&
        other.cellKeys.includes(key),
    )
    if (lockedBySolvedEntry) continue

    if (normalizeWordAnswer(cell.user) === normalizeWordAnswer(cell.solution)) continue

    const [row, col] = key.split(',').map(Number)
    nextSession = clearCrosswordCell(nextSession, row, col)
  }

  return nextSession
}

export function countRevealableCrosswordCells(session: CrosswordSession, entryId?: string): number {
  const entries = entryId
    ? session.entries.filter((entry) => entry.id === entryId)
    : session.entries

  let count = 0
  for (const entry of entries) {
    if (session.solvedEntryIds.has(entry.id)) continue

    for (const key of entry.cellKeys) {
      const cell = session.cells[key]
      if (!cell || cell.isBlock) continue
      if (normalizeWordAnswer(cell.user) !== normalizeWordAnswer(cell.solution)) {
        count += 1
      }
    }
  }

  return count
}

export function hasRevealableCrosswordCells(session: CrosswordSession, entryId?: string): boolean {
  return countRevealableCrosswordCells(session, entryId) > 0
}

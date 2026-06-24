import type { WordSearchDirection, WordSearchEntry } from '../types/wordSearch'

export type WordSearchWordInput = {
  id?: number
  word: string
  hint: string
}

type GridMatrix = (string | null)[][]

type Placement = {
  word: string
  hint: string
  direction: WordSearchDirection
  row: number
  col: number
}

const GRID_SIZE = 9
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const DIRECTION_DELTAS: Record<WordSearchDirection, [number, number]> = {
  horizontal: [0, 1],
  'horizontal-reverse': [0, -1],
  vertical: [1, 0],
  'vertical-reverse': [-1, 0],
  'diagonal-down-right': [1, 1],
  'diagonal-down-left': [1, -1],
  'diagonal-up-right': [-1, 1],
  'diagonal-up-left': [-1, -1],
}

const ALL_DIRECTIONS = Object.keys(DIRECTION_DELTAS) as WordSearchDirection[]

const DIFFICULTY_CONFIG = {
  facil: { poolSize: 48, targetWords: 8, minWords: 5, maxAttempts: 120 },
  medio: { poolSize: 56, targetWords: 10, minWords: 6, maxAttempts: 140 },
  dificil: { poolSize: 64, targetWords: 12, minWords: 7, maxAttempts: 160 },
} as const

function cellKey(row: number, col: number): string {
  return `${row},${col}`
}

function createEmptyGrid(): GridMatrix {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => null))
}

function shuffle<T>(values: readonly T[]): T[] {
  const array = [...values]
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[array[index], array[swapIndex]] = [array[swapIndex], array[index]]
  }
  return array
}

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE
}

function randomLetter(): string {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)]
}

function canPlaceWord(
  grid: GridMatrix,
  word: string,
  row: number,
  col: number,
  direction: WordSearchDirection,
): boolean {
  const [dr, dc] = DIRECTION_DELTAS[direction]

  for (let index = 0; index < word.length; index += 1) {
    const nextRow = row + dr * index
    const nextCol = col + dc * index

    if (!inBounds(nextRow, nextCol)) return false

    const existing = grid[nextRow][nextCol]
    if (existing && existing !== word[index]) return false
  }

  return true
}

function placeWord(
  grid: GridMatrix,
  word: string,
  row: number,
  col: number,
  direction: WordSearchDirection,
): void {
  const [dr, dc] = DIRECTION_DELTAS[direction]

  for (let index = 0; index < word.length; index += 1) {
    grid[row + dr * index][col + dc * index] = word[index]
  }
}

function fillEmptyCells(grid: GridMatrix): void {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (!grid[row][col]) {
        grid[row][col] = randomLetter()
      }
    }
  }
}

function buildEntry(
  placement: Placement,
  number: number,
): WordSearchEntry {
  const [dr, dc] = DIRECTION_DELTAS[placement.direction]
  const cellKeys: string[] = []

  for (let index = 0; index < placement.word.length; index += 1) {
    cellKeys.push(cellKey(placement.row + dr * index, placement.col + dc * index))
  }

  return {
    id: `entry-${number}`,
    word: placement.word,
    hint: placement.hint,
    direction: placement.direction,
    row: placement.row,
    col: placement.col,
    number,
    cellKeys,
  }
}

function tryPlaceWords(words: WordSearchWordInput[]): Placement[] | null {
  const grid = createEmptyGrid()
  const placements: Placement[] = []
  const sorted = [...words].sort((left, right) => right.word.length - left.word.length)

  for (const candidate of sorted) {
    const directions = shuffle(ALL_DIRECTIONS)
    let placed = false

    const startPositions = shuffle(
      Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => ({
        row: Math.floor(index / GRID_SIZE),
        col: index % GRID_SIZE,
      })),
    )

    for (const { row, col } of startPositions) {
      for (const direction of directions) {
        if (!canPlaceWord(grid, candidate.word, row, col, direction)) continue

        placeWord(grid, candidate.word, row, col, direction)
        placements.push({
          word: candidate.word,
          hint: candidate.hint,
          direction,
          row,
          col,
        })
        placed = true
        break
      }

      if (placed) break
    }

    if (!placed) return null
  }

  fillEmptyCells(grid)
  return placements
}

function buildCells(grid: GridMatrix): Record<string, { row: number; col: number; letter: string }> {
  const cells: Record<string, { row: number; col: number; letter: string }> = {}

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const letter = grid[row][col]
      if (!letter) continue
      cells[cellKey(row, col)] = { row, col, letter }
    }
  }

  return cells
}

export function filterWordSearchCandidates(
  words: WordSearchWordInput[],
  difficulty: keyof typeof DIFFICULTY_CONFIG,
): WordSearchWordInput[] {
  const seen = new Set<string>()
  const filtered: WordSearchWordInput[] = []

  for (const entry of words) {
    const word = entry.word.trim().toUpperCase()
    const hint = entry.hint.trim()
    if (!word || !hint) continue
    if (word.length > GRID_SIZE) continue
    if (seen.has(word)) continue

    seen.add(word)
    filtered.push({ ...entry, word, hint })
  }

  return filtered.slice(0, DIFFICULTY_CONFIG[difficulty].poolSize)
}

export function buildWordSearchPuzzleId(
  difficulty: keyof typeof DIFFICULTY_CONFIG,
  entries: WordSearchEntry[],
): string {
  const words = entries
    .map((entry) => entry.word)
    .sort()
    .join('|')
  return `${difficulty}-${words}`
}

export function generateWordSearch(
  words: WordSearchWordInput[],
  difficulty: keyof typeof DIFFICULTY_CONFIG,
  seedOffset = 0,
): {
  entries: WordSearchEntry[]
  cells: Record<string, { row: number; col: number; letter: string }>
  rows: number
  cols: number
} | null {
  const config = DIFFICULTY_CONFIG[difficulty]
  const pool = filterWordSearchCandidates(words, difficulty)
  if (pool.length < config.minWords) return null

  let best: Placement[] | null = null

  for (let attempt = 0; attempt < config.maxAttempts; attempt += 1) {
    const shuffled = shuffle(pool).slice(0, config.targetWords)
    const placements = tryPlaceWords(shuffled)
    if (!placements) continue

    if (!best || placements.length > best.length) {
      best = placements
    }

    if (placements.length >= config.targetWords) {
      best = placements
      break
    }
  }

  if (!best || best.length < config.minWords) return null

  const grid = createEmptyGrid()
  for (const placement of best) {
    placeWord(grid, placement.word, placement.row, placement.col, placement.direction)
  }
  fillEmptyCells(grid)

  const entries = best.map((placement, index) => buildEntry(placement, index + 1))

  return {
    entries,
    cells: buildCells(grid),
    rows: GRID_SIZE,
    cols: GRID_SIZE,
  }
}

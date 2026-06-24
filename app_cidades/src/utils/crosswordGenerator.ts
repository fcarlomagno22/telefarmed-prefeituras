import type { CrosswordDirection, CrosswordEntry } from '../types/crossword'

export type CrosswordWordInput = {
  id?: number
  word: string
  hint: string
}

type GridMatrix = (string | null)[][]

type Placement = {
  word: string
  hint: string
  direction: CrosswordDirection
  row: number
  col: number
}

type PlacementCandidate = Placement & {
  score: number
}

const GRID_SIZE = 9
const GRID_CENTER = Math.floor(GRID_SIZE / 2)

const DIFFICULTY_CONFIG = {
  facil: { poolSize: 48, targetWords: 8, minWords: 4, maxAttempts: 80 },
  medio: { poolSize: 56, targetWords: 10, minWords: 5, maxAttempts: 100 },
  dificil: { poolSize: 64, targetWords: 12, minWords: 6, maxAttempts: 120 },
} as const

function cellKey(row: number, col: number): string {
  return `${row},${col}`
}

function createEmptyGrid(): GridMatrix {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => null))
}

function cloneGrid(grid: GridMatrix): GridMatrix {
  return grid.map((row) => [...row])
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

function getDirectionDelta(direction: CrosswordDirection): [number, number] {
  return direction === 'across' ? [0, 1] : [1, 0]
}

function getPerpendicularDelta(direction: CrosswordDirection): [number, number][] {
  return direction === 'across'
    ? [
        [-1, 0],
        [1, 0],
      ]
    : [
        [0, -1],
        [0, 1],
      ]
}

function countFilledCells(grid: GridMatrix): number {
  let count = 0
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col]) count += 1
    }
  }
  return count
}

function getBoundingBox(grid: GridMatrix): {
  minRow: number
  maxRow: number
  minCol: number
  maxCol: number
} | null {
  let minRow = GRID_SIZE
  let minCol = GRID_SIZE
  let maxRow = -1
  let maxCol = -1

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (!grid[row][col]) continue
      minRow = Math.min(minRow, row)
      minCol = Math.min(minCol, col)
      maxRow = Math.max(maxRow, row)
      maxCol = Math.max(maxCol, col)
    }
  }

  if (maxRow === -1) return null

  return { minRow, maxRow, minCol, maxCol }
}

function canPlaceWord(
  grid: GridMatrix,
  word: string,
  row: number,
  col: number,
  direction: CrosswordDirection,
  requireCrossing: boolean,
): boolean {
  const letters = word.split('')
  const [dr, dc] = getDirectionDelta(direction)

  const beforeRow = row - dr
  const beforeCol = col - dc
  if (inBounds(beforeRow, beforeCol) && grid[beforeRow][beforeCol]) return false

  const afterRow = row + dr * letters.length
  const afterCol = col + dc * letters.length
  if (inBounds(afterRow, afterCol) && grid[afterRow][afterCol]) return false

  let crossings = 0

  for (let index = 0; index < letters.length; index += 1) {
    const currentRow = row + dr * index
    const currentCol = col + dc * index
    if (!inBounds(currentRow, currentCol)) return false

    const existing = grid[currentRow][currentCol]
    const letter = letters[index]

    if (existing) {
      if (existing !== letter) return false
      crossings += 1
      continue
    }

    for (const [pdr, pdc] of getPerpendicularDelta(direction)) {
      const neighborRow = currentRow + pdr
      const neighborCol = currentCol + pdc
      if (inBounds(neighborRow, neighborCol) && grid[neighborRow][neighborCol]) {
        return false
      }
    }
  }

  if (requireCrossing && crossings === 0) return false
  return true
}

function applyPlacement(grid: GridMatrix, placement: Placement): void {
  const letters = placement.word.split('')
  const [dr, dc] = getDirectionDelta(placement.direction)

  for (let index = 0; index < letters.length; index += 1) {
    const row = placement.row + dr * index
    const col = placement.col + dc * index
    grid[row][col] = letters[index]
  }
}

function scorePlacement(grid: GridMatrix, placement: Placement): number {
  const letters = placement.word.split('')
  const [dr, dc] = getDirectionDelta(placement.direction)
  let crossings = 0
  let newLetters = 0

  for (let index = 0; index < letters.length; index += 1) {
    const row = placement.row + dr * index
    const col = placement.col + dc * index
    if (grid[row][col]) crossings += 1
    else newLetters += 1
  }

  const simulated = cloneGrid(grid)
  applyPlacement(simulated, placement)
  const bounds = getBoundingBox(simulated)
  if (!bounds) return -Infinity

  const bboxArea = (bounds.maxRow - bounds.minRow + 1) * (bounds.maxCol - bounds.minCol + 1)
  const filled = countFilledCells(simulated)
  const utilization = filled / bboxArea

  const midpointRow = placement.row + (dr * (letters.length - 1)) / 2
  const midpointCol = placement.col + (dc * (letters.length - 1)) / 2
  const centerDistance = Math.abs(midpointRow - GRID_CENTER) + Math.abs(midpointCol - GRID_CENTER)

  return (
    crossings * 120 +
    utilization * 40 +
    newLetters * 6 -
    bboxArea * 1.5 -
    centerDistance * 4
  )
}

function findPlacementCandidates(grid: GridMatrix, word: string, hint: string): PlacementCandidate[] {
  const candidates: PlacementCandidate[] = []
  const letters = word.split('')

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (!grid[row][col]) continue

      for (const direction of ['across', 'down'] as const) {
        const [dr, dc] = getDirectionDelta(direction)

        for (let wordIndex = 0; wordIndex < letters.length; wordIndex += 1) {
          if (grid[row][col] !== letters[wordIndex]) continue

          const startRow = row - dr * wordIndex
          const startCol = col - dc * wordIndex
          const placement: Placement = {
            word,
            hint,
            direction,
            row: startRow,
            col: startCol,
          }

          if (!canPlaceWord(grid, word, startRow, startCol, direction, true)) continue

          candidates.push({
            ...placement,
            score: scorePlacement(grid, placement),
          })
        }
      }
    }
  }

  return candidates.sort((a, b) => b.score - a.score)
}

function placeFirstWord(grid: GridMatrix, word: string, hint: string): Placement | null {
  const letters = word.split('')
  const direction: CrosswordDirection = 'across'

  const candidates: Placement[] = []

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let startCol = 0; startCol <= GRID_SIZE - letters.length; startCol += 1) {
      if (!canPlaceWord(grid, word, row, startCol, direction, false)) continue
      candidates.push({ word, hint, direction, row, col: startCol })
    }
  }

  if (candidates.length === 0) return null

  const idealCol = Math.floor((GRID_SIZE - letters.length) / 2)
  const idealRow = GRID_CENTER

  candidates.sort((a, b) => {
    const scoreA =
      Math.abs(a.row - idealRow) * 4 +
      Math.abs(a.col - idealCol) * 3 -
      Math.abs(a.col + letters.length / 2 - GRID_CENTER)
    const scoreB =
      Math.abs(b.row - idealRow) * 4 +
      Math.abs(b.col - idealCol) * 3 -
      Math.abs(b.col + letters.length / 2 - GRID_CENTER)
    return scoreA - scoreB
  })

  const placement = candidates[0]
  applyPlacement(grid, placement)
  return placement
}

function buildCrosswordFromWords(words: CrosswordWordInput[], targetWords: number): Placement[] | null {
  if (words.length === 0) return null

  const sorted = [...words].sort((a, b) => b.word.length - a.word.length)
  const grid = createEmptyGrid()
  const placements: Placement[] = []

  const first = sorted[0]
  if (first.word.length > GRID_SIZE) return null

  const firstPlacement = placeFirstWord(grid, first.word, first.hint)
  if (!firstPlacement) return null
  placements.push(firstPlacement)

  for (const candidate of sorted.slice(1)) {
    if (placements.length >= targetWords) break
    if (candidate.word.length > GRID_SIZE) continue

    const options = findPlacementCandidates(grid, candidate.word, candidate.hint)
    if (options.length === 0) continue

    const best = options[0]
    applyPlacement(grid, best)
    placements.push(best)
  }

  if (placements.length < 2) return null
  return placements
}

function assignNumbers(placements: Placement[], rowOffset: number, colOffset: number): CrosswordEntry[] {
  const starts = placements
    .map((placement) => ({
      row: placement.row - rowOffset,
      col: placement.col - colOffset,
      placement,
    }))
    .sort((a, b) => (a.row === b.row ? a.col - b.col : a.row - b.row))

  const numberByStart = new Map<string, number>()
  let nextNumber = 1

  for (const start of starts) {
    const key = cellKey(start.row, start.col)
    if (!numberByStart.has(key)) {
      numberByStart.set(key, nextNumber)
      nextNumber += 1
    }
  }

  return placements.map((placement, index) => {
    const letters = placement.word.split('')
    const [dr, dc] = getDirectionDelta(placement.direction)
    const displayRow = placement.row - rowOffset
    const displayCol = placement.col - colOffset
    const cellKeys = letters.map((_, letterIndex) =>
      cellKey(displayRow + dr * letterIndex, displayCol + dc * letterIndex),
    )

    return {
      id: `entry-${index + 1}`,
      word: placement.word,
      hint: placement.hint,
      direction: placement.direction,
      row: displayRow,
      col: displayCol,
      number: numberByStart.get(cellKey(displayRow, displayCol)) ?? 1,
      cellKeys,
    }
  })
}

function buildDisplayCells(grid: GridMatrix): {
  cells: Record<string, { row: number; col: number; isBlock: boolean; solution: string; user: string; number?: number }>
  rows: number
  cols: number
  rowOffset: number
  colOffset: number
} | null {
  const bounds = getBoundingBox(grid)
  if (!bounds) return null

  const { minRow, maxRow, minCol, maxCol } = bounds
  const rows = maxRow - minRow + 1
  const cols = maxCol - minCol + 1
  const cells: Record<string, { row: number; col: number; isBlock: boolean; solution: string; user: string; number?: number }> = {}

  for (let row = minRow; row <= maxRow; row += 1) {
    for (let col = minCol; col <= maxCol; col += 1) {
      const displayRow = row - minRow
      const displayCol = col - minCol
      const letter = grid[row][col]

      cells[cellKey(displayRow, displayCol)] = {
        row: displayRow,
        col: displayCol,
        isBlock: !letter,
        solution: letter ?? '',
        user: '',
      }
    }
  }

  return {
    cells,
    rows,
    cols,
    rowOffset: minRow,
    colOffset: minCol,
  }
}

function buildPuzzleFromPlacements(placements: Placement[]): {
  entries: CrosswordEntry[]
  cells: Record<string, { row: number; col: number; isBlock: boolean; solution: string; user: string; number?: number }>
  rows: number
  cols: number
  rowOffset: number
  colOffset: number
} | null {
  const grid = createEmptyGrid()
  for (const placement of placements) {
    applyPlacement(grid, placement)
  }

  const layout = buildDisplayCells(grid)
  if (!layout) return null

  const entries = assignNumbers(placements, layout.rowOffset, layout.colOffset)

  for (const entry of entries) {
    const startKey = cellKey(entry.row, entry.col)
    const startCell = layout.cells[startKey]
    if (startCell && !startCell.isBlock) {
      startCell.number = entry.number
    }
  }

  return {
    entries,
    ...layout,
  }
}

export function filterCrosswordCandidates(
  words: CrosswordWordInput[],
  difficulty: keyof typeof DIFFICULTY_CONFIG,
): CrosswordWordInput[] {
  const seen = new Set<string>()
  const filtered: CrosswordWordInput[] = []

  for (const entry of words) {
    const word = entry.word.trim().toUpperCase()
    const hint = entry.hint.trim()
    if (!word || !hint) continue
    if (word.length > GRID_SIZE) continue
    if (seen.has(word)) continue

    seen.add(word)
    filtered.push({ ...entry, word, hint })
  }

  return filtered
}

export function generateCrossword(
  words: CrosswordWordInput[],
  difficulty: keyof typeof DIFFICULTY_CONFIG,
  seedOffset = 0,
): {
  entries: CrosswordEntry[]
  cells: Record<string, { row: number; col: number; isBlock: boolean; solution: string; user: string; number?: number }>
  rows: number
  cols: number
  rowOffset: number
  colOffset: number
} | null {
  const config = DIFFICULTY_CONFIG[difficulty]
  const pool = filterCrosswordCandidates(words, difficulty)
  if (pool.length < config.minWords) return null

  let best: Placement[] | null = null

  for (let attempt = 0; attempt < config.maxAttempts; attempt += 1) {
    const shuffled = shuffle(pool)
    const startIndex = (attempt + seedOffset) % shuffled.length
    const rotated = [...shuffled.slice(startIndex), ...shuffled.slice(0, startIndex)]
    const sample = rotated.slice(0, config.poolSize)
    const result = buildCrosswordFromWords(sample, config.targetWords)

    if (!result) continue
    if (!best || result.length > best.length) {
      best = result
      if (best.length >= config.targetWords) break
    }
  }

  if (!best || best.length < config.minWords) return null

  return buildPuzzleFromPlacements(best)
}

export function buildCrosswordPuzzleId(
  difficulty: keyof typeof DIFFICULTY_CONFIG,
  entries: CrosswordEntry[],
): string {
  const signature = entries
    .map((entry) => entry.word)
    .sort()
    .join('|')

  return `${difficulty}-${signature}`
}

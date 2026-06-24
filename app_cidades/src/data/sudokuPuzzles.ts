import type { ActiveMindPlayDifficulty } from '../types/activeMind'
import type { SudokuCellValue, SudokuGrid, SudokuPuzzleBank, SudokuPuzzleEntry, SudokuSession } from '../types/sudoku'

const SUDOKU_BANKS: Record<ActiveMindPlayDifficulty, SudokuPuzzleBank> = {
  facil: require('../../content/activeMind/sudoku/sudoku_facil.json'),
  medio: require('../../content/activeMind/sudoku/sudoku_medio.json'),
  dificil: require('../../content/activeMind/sudoku/sudoku_dificil.json'),
}

export function getSudokuBank(difficulty: ActiveMindPlayDifficulty): SudokuPuzzleBank {
  return SUDOKU_BANKS[difficulty]
}

export function pickRandomSudokuPuzzle(
  difficulty: ActiveMindPlayDifficulty,
  excludeId?: string,
): SudokuPuzzleEntry {
  const bank = getSudokuBank(difficulty)
  const candidates = excludeId
    ? bank.puzzles.filter((puzzle) => puzzle.id !== excludeId)
    : bank.puzzles

  const pool = candidates.length > 0 ? candidates : bank.puzzles
  const index = Math.floor(Math.random() * pool.length)
  return pool[index]
}

export function parseSudokuString(value: string): SudokuGrid {
  return value.split('').map((char) => Number(char) as SudokuCellValue)
}

export function createSudokuSession(
  difficulty: ActiveMindPlayDifficulty,
  excludeId?: string,
): SudokuSession {
  const puzzle = pickRandomSudokuPuzzle(difficulty, excludeId)
  const initial = parseSudokuString(puzzle.puzzle)
  const solution = parseSudokuString(puzzle.solution)
  const givens = initial.map((cell) => cell !== 0)

  return {
    puzzleId: puzzle.id,
    difficulty,
    givens,
    revealed: new Array(81).fill(false),
    values: [...initial],
    solution,
  }
}

export function cloneSudokuValues(values: SudokuGrid): SudokuGrid {
  return [...values]
}

export function isSudokuComplete(values: SudokuGrid): boolean {
  return values.every((value) => value !== 0)
}

export function isSudokuSolved(session: SudokuSession): boolean {
  return session.values.every((value, index) => value === session.solution[index])
}

export function getSudokuConflictIndexes(values: SudokuGrid): Set<number> {
  const conflicts = new Set<number>()

  for (let index = 0; index < 81; index += 1) {
    const value = values[index]
    if (value === 0) continue

    const row = Math.floor(index / 9)
    const col = index % 9

    for (let peer = 0; peer < 9; peer += 1) {
      const rowPeer = row * 9 + peer
      if (rowPeer !== index && values[rowPeer] === value) {
        conflicts.add(index)
        conflicts.add(rowPeer)
      }

      const colPeer = peer * 9 + col
      if (colPeer !== index && values[colPeer] === value) {
        conflicts.add(index)
        conflicts.add(colPeer)
      }
    }

    const boxRow = Math.floor(row / 3) * 3
    const boxCol = Math.floor(col / 3) * 3

    for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
      for (let colOffset = 0; colOffset < 3; colOffset += 1) {
        const boxPeer = (boxRow + rowOffset) * 9 + (boxCol + colOffset)
        if (boxPeer !== index && values[boxPeer] === value) {
          conflicts.add(index)
          conflicts.add(boxPeer)
        }
      }
    }
  }

  return conflicts
}

type SudokuConflictScope = 'row' | 'col' | 'box'

function getSudokuConflictScopesAt(values: SudokuGrid, index: number): SudokuConflictScope[] {
  const value = values[index]
  if (value === 0) return []

  const scopes: SudokuConflictScope[] = []
  const row = Math.floor(index / 9)
  const col = index % 9

  for (let peerCol = 0; peerCol < 9; peerCol += 1) {
    if (peerCol === col) continue
    if (values[row * 9 + peerCol] === value) {
      scopes.push('row')
      break
    }
  }

  for (let peerRow = 0; peerRow < 9; peerRow += 1) {
    if (peerRow === row) continue
    if (values[peerRow * 9 + col] === value) {
      scopes.push('col')
      break
    }
  }

  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3

  for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
    for (let colOffset = 0; colOffset < 3; colOffset += 1) {
      const peerIndex = (boxRow + rowOffset) * 9 + (boxCol + colOffset)
      if (peerIndex === index) continue
      if (values[peerIndex] === value) {
        scopes.push('box')
        return scopes
      }
    }
  }

  return scopes
}

function formatSudokuConflictMessage(scopes: SudokuConflictScope[], value: SudokuCellValue): string {
  const labels = scopes.map((scope) => {
    if (scope === 'row') return 'nesta linha'
    if (scope === 'col') return 'nesta coluna'
    return 'neste bloco'
  })

  if (labels.length === 1) {
    return `O número ${value} já aparece ${labels[0]}.`
  }

  if (labels.length === 2) {
    return `O número ${value} já aparece ${labels[0]} e ${labels[1]}.`
  }

  return `O número ${value} já aparece ${labels[0]}, ${labels[1]} e ${labels[2]}.`
}

export function getSudokuDuplicatePeerIndexes(values: SudokuGrid, index: number): number[] {
  const value = values[index]
  if (value === 0) return []

  const peers = new Set<number>()
  const row = Math.floor(index / 9)
  const col = index % 9

  for (let peerCol = 0; peerCol < 9; peerCol += 1) {
    const peerIndex = row * 9 + peerCol
    if (peerIndex !== index && values[peerIndex] === value) {
      peers.add(peerIndex)
    }
  }

  for (let peerRow = 0; peerRow < 9; peerRow += 1) {
    const peerIndex = peerRow * 9 + col
    if (peerIndex !== index && values[peerIndex] === value) {
      peers.add(peerIndex)
    }
  }

  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3

  for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
    for (let colOffset = 0; colOffset < 3; colOffset += 1) {
      const peerIndex = (boxRow + rowOffset) * 9 + (boxCol + colOffset)
      if (peerIndex !== index && values[peerIndex] === value) {
        peers.add(peerIndex)
      }
    }
  }

  return [...peers]
}

export function getSudokuConflictMessage(
  values: SudokuGrid,
  focusIndex: number | null,
): string | null {
  const conflictIndexes = getSudokuConflictIndexes(values)
  if (conflictIndexes.size === 0) return null

  const conflictIndex =
    focusIndex != null && conflictIndexes.has(focusIndex)
      ? focusIndex
      : conflictIndexes.values().next().value

  if (conflictIndex == null) return null

  const scopes = getSudokuConflictScopesAt(values, conflictIndex)
  if (scopes.length === 0) return null

  return formatSudokuConflictMessage(scopes, values[conflictIndex])
}

export function getRelatedSudokuIndexes(index: number): Set<number> {
  const related = new Set<number>()
  const row = Math.floor(index / 9)
  const col = index % 9

  for (let peer = 0; peer < 9; peer += 1) {
    related.add(row * 9 + peer)
    related.add(peer * 9 + col)
  }

  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3

  for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
    for (let colOffset = 0; colOffset < 3; colOffset += 1) {
      related.add((boxRow + rowOffset) * 9 + (boxCol + colOffset))
    }
  }

  return related
}

export function isSudokuCellLocked(session: SudokuSession, index: number): boolean {
  return session.givens[index] || session.revealed[index]
}

export function setSudokuCellValue(
  session: SudokuSession,
  index: number,
  value: SudokuCellValue,
): SudokuSession {
  if (isSudokuCellLocked(session, index)) {
    return session
  }

  return {
    ...session,
    values: session.values.map((current, cellIndex) =>
      cellIndex === index ? value : current,
    ),
  }
}

export function clearSudokuCell(session: SudokuSession, index: number): SudokuSession {
  return setSudokuCellValue(session, index, 0)
}

export function revealSudokuCell(session: SudokuSession, index: number): SudokuSession {
  if (isSudokuCellLocked(session, index)) {
    return session
  }

  const solutionValue = session.solution[index]
  if (solutionValue === 0) {
    return session
  }

  return {
    ...session,
    revealed: session.revealed.map((revealed, cellIndex) =>
      cellIndex === index ? true : revealed,
    ),
    values: session.values.map((current, cellIndex) =>
      cellIndex === index ? solutionValue : current,
    ),
  }
}

export function revealAllSudokuCells(session: SudokuSession): SudokuSession {
  let nextSession = session

  for (let index = 0; index < 81; index += 1) {
    if (isSudokuCellLocked(nextSession, index)) continue
    if (nextSession.values[index] === nextSession.solution[index]) continue

    nextSession = revealSudokuCell(nextSession, index)
  }

  return nextSession
}

export function hasRevealableSudokuCells(session: SudokuSession): boolean {
  return session.values.some((value, index) => {
    if (isSudokuCellLocked(session, index)) return false
    return value !== session.solution[index]
  })
}

export function countRevealableSudokuCells(session: SudokuSession): number {
  return session.values.reduce((count, value, index) => {
    if (isSudokuCellLocked(session, index)) return count
    return value !== session.solution[index] ? count + 1 : count
  }, 0)
}

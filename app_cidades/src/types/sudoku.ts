import type { ActiveMindPlayDifficulty } from './activeMind'

export type SudokuCellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type SudokuGrid = SudokuCellValue[]

export type SudokuPuzzleEntry = {
  id: string
  puzzle: string
  solution: string
  givens: number
}

export type SudokuPuzzleBank = {
  version: number
  difficulty: ActiveMindPlayDifficulty
  count: number
  puzzles: SudokuPuzzleEntry[]
}

export type SudokuCellFeedback = 'correct' | 'wrong' | 'conflict-source'

export type SudokuFeedbackState = {
  cells: Partial<Record<number, SudokuCellFeedback>>
  message: string | null
  entryIndex: number | null
}

export const emptySudokuFeedbackState = (): SudokuFeedbackState => ({
  cells: {},
  message: null,
  entryIndex: null,
})

export type SudokuSession = {
  puzzleId: string
  difficulty: ActiveMindPlayDifficulty
  givens: readonly boolean[]
  revealed: readonly boolean[]
  values: SudokuGrid
  solution: SudokuGrid
}

export type SudokuSessionStats = {
  attempts: number
  correct: number
  errors: number
  reveals: number
}

export const emptySudokuSessionStats = (): SudokuSessionStats => ({
  attempts: 0,
  correct: 0,
  errors: 0,
  reveals: 0,
})

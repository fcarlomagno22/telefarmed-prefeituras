import type { ActiveMindPlayDifficulty } from './activeMind'

export type CrosswordDirection = 'across' | 'down'

export type CrosswordEntry = {
  id: string
  word: string
  hint: string
  direction: CrosswordDirection
  row: number
  col: number
  number: number
  cellKeys: string[]
}

export type CrosswordCellState = {
  row: number
  col: number
  isBlock: boolean
  solution: string
  user: string
  number?: number
}

export type CrosswordSession = {
  puzzleId: string
  difficulty: ActiveMindPlayDifficulty
  rows: number
  cols: number
  rowOffset: number
  colOffset: number
  entries: CrosswordEntry[]
  cells: Record<string, CrosswordCellState>
  solvedEntryIds: Set<string>
}

export type CrosswordSessionStats = {
  attempts: number
  correct: number
  errors: number
  reveals: number
}

export const emptyCrosswordSessionStats = (): CrosswordSessionStats => ({
  attempts: 0,
  correct: 0,
  errors: 0,
  reveals: 0,
})

export type CrosswordFeedbackState = {
  active: boolean
  kind: 'correct' | 'wrong' | null
  message: string | null
  entryId: string | null
  cellKeys: string[]
}

export const emptyCrosswordFeedbackState = (): CrosswordFeedbackState => ({
  active: false,
  kind: null,
  message: null,
  entryId: null,
  cellKeys: [],
})

export type CrosswordCellFeedback = 'correct' | 'wrong'

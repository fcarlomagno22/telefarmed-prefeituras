import type { ActiveMindPlayDifficulty } from './activeMind'

export type WordSearchDirection =
  | 'horizontal'
  | 'horizontal-reverse'
  | 'vertical'
  | 'vertical-reverse'
  | 'diagonal-down-right'
  | 'diagonal-down-left'
  | 'diagonal-up-right'
  | 'diagonal-up-left'

export type WordSearchEntry = {
  id: string
  word: string
  hint: string
  direction: WordSearchDirection
  row: number
  col: number
  number: number
  cellKeys: string[]
}

export type WordSearchCellState = {
  row: number
  col: number
  letter: string
}

export type WordSearchSession = {
  puzzleId: string
  difficulty: ActiveMindPlayDifficulty
  rows: number
  cols: number
  entries: WordSearchEntry[]
  cells: Record<string, WordSearchCellState>
  foundEntryIds: Set<string>
}

export type WordSearchSessionStats = {
  attempts: number
  correct: number
  errors: number
  reveals: number
}

export const emptyWordSearchSessionStats = (): WordSearchSessionStats => ({
  attempts: 0,
  correct: 0,
  errors: 0,
  reveals: 0,
})

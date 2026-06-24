import type { ActiveMindPlayDifficulty } from './activeMind'

export type FormTheWordAnswerSlot = {
  poolIndex: number
  chunk: string
}

export type FormTheWordWordEntry = {
  word: string
  hint: string
}

export type FormTheWordSession = {
  puzzleId: string
  difficulty: ActiveMindPlayDifficulty
  word: string
  hint: string
  chunks: string[]
  scrambled: string[]
  answer: FormTheWordAnswerSlot[]
  usedPoolIndexes: Set<number>
}

export type FormTheWordSessionStats = {
  attempts: number
  correct: number
  errors: number
  reveals: number
}

export const emptyFormTheWordSessionStats = (): FormTheWordSessionStats => ({
  attempts: 0,
  correct: 0,
  errors: 0,
  reveals: 0,
})

export type FormTheWordFeedbackState = {
  active: boolean
  kind: 'correct' | 'wrong' | null
  message: string | null
}

export const emptyFormTheWordFeedbackState = (): FormTheWordFeedbackState => ({
  active: false,
  kind: null,
  message: null,
})

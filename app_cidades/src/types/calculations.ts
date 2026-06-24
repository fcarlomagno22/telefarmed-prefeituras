import type { ActiveMindPlayDifficulty } from './activeMind'

export type CalculationsEntry = {
  id: string
  nivel: string
  tipo: string
  pergunta: string
  resposta: number
}

export type CalculationsSession = {
  puzzleId: string
  difficulty: ActiveMindPlayDifficulty
  pergunta: string
  resposta: number
  tipo: string
  answer: string
}

export type CalculationsSessionStats = {
  attempts: number
  correct: number
  errors: number
  reveals: number
}

export const emptyCalculationsSessionStats = (): CalculationsSessionStats => ({
  attempts: 0,
  correct: 0,
  errors: 0,
  reveals: 0,
})

export type CalculationsFeedbackState = {
  active: boolean
  kind: 'correct' | 'wrong' | null
  message: string | null
}

export const emptyCalculationsFeedbackState = (): CalculationsFeedbackState => ({
  active: false,
  kind: null,
  message: null,
})

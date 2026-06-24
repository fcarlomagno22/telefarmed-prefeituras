import type { ActiveMindPlayDifficulty } from './activeMind'

export type LogicSequenceItemType = 'numero' | 'forma' | 'simbolo'

export type LogicSequenceItem = string | number

export type LogicSequenceSession = {
  puzzleId: string
  difficulty: ActiveMindPlayDifficulty
  enunciado: string
  tipo: LogicSequenceItemType
  sequencia: LogicSequenceItem[]
  resposta: LogicSequenceItem
  opcoes: LogicSequenceItem[]
  selectedOption: LogicSequenceItem | null
}

export type LogicSequenceSessionStats = {
  attempts: number
  correct: number
  errors: number
  reveals: number
}

export const emptyLogicSequenceSessionStats = (): LogicSequenceSessionStats => ({
  attempts: 0,
  correct: 0,
  errors: 0,
  reveals: 0,
})

export type LogicSequenceFeedbackState = {
  active: boolean
  kind: 'correct' | 'wrong' | null
  message: string | null
}

export const emptyLogicSequenceFeedbackState = (): LogicSequenceFeedbackState => ({
  active: false,
  kind: null,
  message: null,
})

import type { EmotionalScreeningSessionRecord } from '../../types/emotionalScreening'
import type { TdahTodSessionRecord } from '../../tdahTodInfantil/types'
import type { ScaredSessionRecord } from '../../scaredInfantil/types'

export type EmotionalScreeningHistoryItem =
  | {
      kind: 'emotional'
      completedAt: string
      session: EmotionalScreeningSessionRecord
    }
  | {
      kind: 'tdah-tod'
      completedAt: string
      session: TdahTodSessionRecord
    }
  | {
      kind: 'scared'
      completedAt: string
      session: ScaredSessionRecord
    }

export function getScreeningClassificationColor(classificationId: string) {
  switch (classificationId) {
    case 'prioridade_clinica':
      return '#f87171'
    case 'sinais_importantes':
      return '#fb923c'
    case 'sinais_moderados':
      return '#fbbf24'
    case 'sinais_leves':
      return '#86efac'
    default:
      return '#93c5fd'
  }
}

export function getTdahTodClassificationColor(classificationId: string) {
  return getScreeningClassificationColor(classificationId)
}

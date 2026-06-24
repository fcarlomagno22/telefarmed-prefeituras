import type { ActiveMindPlayDifficulty } from '../../types/activeMind'

export const ACTIVE_MIND_DIFFICULTY_OPTIONS: {
  id: ActiveMindPlayDifficulty
  title: string
  description: string
  gradient: readonly [string, string, string]
  shadowColor: string
}[] = [
  {
    id: 'facil',
    title: 'Fácil',
    description: 'Ideal para começar e aquecer a mente com calma.',
    gradient: ['#86efac', '#22c55e', '#15803d'],
    shadowColor: 'rgba(34, 197, 94, 0.38)',
  },
  {
    id: 'medio',
    title: 'Médio',
    description: 'Desafio equilibrado para manter o foco e evoluir.',
    gradient: ['#fde68a', '#f59e0b', '#d97706'],
    shadowColor: 'rgba(245, 158, 11, 0.38)',
  },
  {
    id: 'dificil',
    title: 'Difícil',
    description: 'Para quem quer ir além e testar os limites.',
    gradient: ['#fca5a5', '#ef4444', '#dc2626'],
    shadowColor: 'rgba(239, 68, 68, 0.38)',
  },
]

export function getActiveMindDifficultyLabel(difficulty: ActiveMindPlayDifficulty): string {
  return ACTIVE_MIND_DIFFICULTY_OPTIONS.find((option) => option.id === difficulty)?.title ?? difficulty
}

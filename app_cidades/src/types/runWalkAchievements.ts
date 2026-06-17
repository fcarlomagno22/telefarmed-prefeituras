export type RunWalkAchievementCategoryId =
  | 'first-steps'
  | 'walk'
  | 'run'
  | 'consistency'
  | 'active-time'
  | 'distance'
  | 'health'

import type { MaterialCommunityIcons } from '@expo/vector-icons'

export type RunWalkAchievementIcon = keyof typeof MaterialCommunityIcons.glyphMap

export type RunWalkAchievement = {
  id: string
  title: string
  categories: RunWalkAchievementCategoryId[]
  icon: RunWalkAchievementIcon
  unlocked: boolean
  unlockedAt: string | null
  relatedActivity: string | null
  meaning: string
  nextAchievementId: string | null
  accentColor: string
}

export const RUN_WALK_ACHIEVEMENT_CATEGORIES: {
  id: RunWalkAchievementCategoryId | 'all'
  label: string
}[] = [
  { id: 'all', label: 'Todas' },
  { id: 'first-steps', label: 'Primeiros passos' },
  { id: 'walk', label: 'Caminhada' },
  { id: 'run', label: 'Corrida' },
  { id: 'consistency', label: 'Consistência' },
  { id: 'active-time', label: 'Tempo ativo' },
  { id: 'distance', label: 'Distância' },
  { id: 'health', label: 'Saúde e bem-estar' },
]

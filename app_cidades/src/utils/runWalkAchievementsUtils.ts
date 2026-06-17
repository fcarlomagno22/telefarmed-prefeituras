import type {
  RunWalkAchievement,
  RunWalkAchievementCategoryId,
} from '../types/runWalkAchievements'
import { RUN_WALK_ACHIEVEMENT_CATEGORIES } from '../types/runWalkAchievements'

export type RunWalkAchievementCategoryGroup = {
  id: RunWalkAchievementCategoryId
  label: string
  achievements: RunWalkAchievement[]
  unlockedCount: number
}

export function getAchievementStats(achievements: RunWalkAchievement[]) {
  const unlocked = achievements.filter((item) => item.unlocked)
  const locked = achievements.length - unlocked.length
  const progress = achievements.length > 0 ? unlocked.length / achievements.length : 0

  return {
    total: achievements.length,
    unlockedCount: unlocked.length,
    lockedCount: locked,
    progress,
  }
}

export function getRecentUnlockedAchievements(achievements: RunWalkAchievement[]) {
  return achievements
    .filter((item) => item.unlocked && item.unlockedAt)
    .sort(
      (left, right) =>
        new Date(right.unlockedAt ?? 0).getTime() - new Date(left.unlockedAt!).getTime(),
    )
}

export function getUpcomingAchievements(achievements: RunWalkAchievement[]) {
  const unlockedIds = new Set(
    achievements.filter((item) => item.unlocked).map((item) => item.id),
  )

  return achievements.filter((item) => {
    if (item.unlocked) return false

    const isDirectNext = achievements.some(
      (candidate) =>
        candidate.unlocked && candidate.nextAchievementId === item.id,
    )

    if (isDirectNext) return true

    const isFirstLockedInTrail = !achievements.some(
      (candidate) => candidate.nextAchievementId === item.id,
    )

    return isFirstLockedInTrail
  })
}

export function groupAchievementsByCategory(
  achievements: RunWalkAchievement[],
): RunWalkAchievementCategoryGroup[] {
  return RUN_WALK_ACHIEVEMENT_CATEGORIES.filter((category) => category.id !== 'all').flatMap(
    (category) => {
      const id = category.id as RunWalkAchievementCategoryId
      const items = achievements.filter((achievement) => achievement.categories.includes(id))

      if (items.length === 0) return []

      return [
        {
          id,
          label: category.label,
          achievements: items,
          unlockedCount: items.filter((item) => item.unlocked).length,
        },
      ]
    },
  )
}

export function formatAchievementDateShort(isoDate: string | null) {
  if (!isoDate) return null

  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

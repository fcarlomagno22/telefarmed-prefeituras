import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { RunWalkAchievementCategoryGroup } from '../../../utils/runWalkAchievementsUtils'
import { RunWalkAchievementTrophyCard } from './RunWalkAchievementTrophyCard'

type RunWalkAchievementsCategorySectionProps = {
  group: RunWalkAchievementCategoryGroup
  onPress: (achievementId: string) => void
}

export function RunWalkAchievementsCategorySection({
  group,
  onPress,
}: RunWalkAchievementsCategorySectionProps) {
  const progress = group.achievements.length
    ? group.unlockedCount / group.achievements.length
    : 0

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{group.label}</Text>
          <Text style={styles.subtitle}>
            {group.unlockedCount} de {group.achievements.length} medalhas
          </Text>
        </View>

        <View style={styles.progressChip}>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.list}>
        {group.achievements.map((achievement) => (
          <RunWalkAchievementTrophyCard
            key={achievement.id}
            achievement={achievement}
            onPress={() => onPress(achievement.id)}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 4,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  progressChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.24)',
  },
  progressText: {
    color: '#fde68a',
    fontSize: 11,
    fontWeight: '800',
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#f59e0b',
  },
  list: {
    gap: 8,
  },
})

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { RunWalkAchievement } from '../../../types/runWalkAchievements'
import { RunWalkAchievementTrophyCard } from './RunWalkAchievementTrophyCard'

type RunWalkAchievementsUpcomingProps = {
  achievements: RunWalkAchievement[]
  onPress: (achievementId: string) => void
}

export function RunWalkAchievementsUpcoming({
  achievements,
  onPress,
}: RunWalkAchievementsUpcomingProps) {
  if (achievements.length === 0) return null

  const nextAchievement = achievements[0]

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(59, 130, 246, 0.16)', 'rgba(14, 14, 20, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.bannerIcon}>
          <MaterialCommunityIcons name="target" size={18} color="#93c5fd" />
        </View>
        <View style={styles.bannerCopy}>
          <Text style={styles.bannerTitle}>Próxima na mira</Text>
          <Text style={styles.bannerText} numberOfLines={2}>
            {nextAchievement.title} está a um passo. Continue se movimentando.
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.list}>
        {achievements.slice(0, 3).map((achievement) => (
          <RunWalkAchievementTrophyCard
            key={achievement.id}
            achievement={achievement}
            featured
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.24)',
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.16)',
  },
  bannerCopy: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  bannerText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  list: {
    gap: 8,
  },
})

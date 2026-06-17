import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { RunWalkAchievement } from '../../../types/runWalkAchievements'
import { RunWalkAchievementMedalMark } from './RunWalkAchievementMedalMark'

type RunWalkAchievementMedalProps = {
  achievement: RunWalkAchievement
  onPress: () => void
}

export function RunWalkAchievementMedal({ achievement, onPress }: RunWalkAchievementMedalProps) {
  const locked = !achievement.unlocked

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={achievement.title}
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={
          locked
            ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
            : [`${achievement.accentColor}33`, 'rgba(14, 14, 20, 0.96)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, locked && styles.cardLocked]}
      >
        <RunWalkAchievementMedalMark
          accentColor={achievement.accentColor}
          icon={achievement.icon}
          locked={locked}
          size="sm"
        />
        <Text style={[styles.title, locked && styles.titleLocked]} numberOfLines={2}>
          {achievement.title}
        </Text>
        <Text style={[styles.status, locked && styles.statusLocked]}>
          {locked ? 'Bloqueada' : 'Conquistada'}
        </Text>
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: '31.5%',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  card: {
    minHeight: 132,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  cardLocked: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  titleLocked: {
    color: colors.textMuted,
  },
  status: {
    color: '#fde68a',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statusLocked: {
    color: colors.textSubtle,
  },
})

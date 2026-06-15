import { StyleSheet, Text, View } from 'react-native'
import type { ExerciseDifficulty } from '../../types/functionalTraining'
import { getDifficultyLabel } from '../../utils/functionalTraining'

const DIFFICULTY_COLORS: Record<
  ExerciseDifficulty,
  { bg: string; border: string; text: string }
> = {
  iniciante: {
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(110, 231, 183, 0.35)',
    text: '#6ee7b7',
  },
  intermediario: {
    bg: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(252, 211, 77, 0.35)',
    text: '#fcd34d',
  },
  avancado: {
    bg: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(252, 165, 165, 0.35)',
    text: '#fca5a5',
  },
}

type FunctionalDifficultyBadgeProps = {
  difficulty: ExerciseDifficulty
  compact?: boolean
}

export function FunctionalDifficultyBadge({
  difficulty,
  compact = false,
}: FunctionalDifficultyBadgeProps) {
  const palette = DIFFICULTY_COLORS[difficulty]

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.label, compact && styles.labelCompact, { color: palette.text }]}>
        {getDifficultyLabel(difficulty)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelCompact: {
    fontSize: 10,
  },
})

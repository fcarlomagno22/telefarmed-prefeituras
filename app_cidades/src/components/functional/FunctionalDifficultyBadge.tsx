import { StyleSheet, Text, View } from 'react-native'
import type { ExerciseDifficulty } from '../../types/functionalTraining'
import { getDifficultyLabel } from '../../utils/functionalTraining'

const DIFFICULTY_COLORS: Record<
  ExerciseDifficulty,
  { bg: string; border: string; text: string }
> = {
  iniciante: {
    bg: '#dcfce7',
    border: 'rgba(22, 163, 74, 0.35)',
    text: '#15803d',
  },
  intermediario: {
    bg: '#fef3c7',
    border: 'rgba(180, 83, 9, 0.35)',
    text: '#b45309',
  },
  avancado: {
    bg: '#fee2e2',
    border: 'rgba(220, 38, 38, 0.35)',
    text: '#dc2626',
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

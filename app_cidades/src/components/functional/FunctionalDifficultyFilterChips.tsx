import * as Haptics from 'expo-haptics'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { colors } from '../../theme/colors'
import type { ExerciseFilterDifficulty } from '../../types/functionalTraining'
import { getDifficultyLabel } from '../../utils/functionalTraining'

type FunctionalDifficultyFilterChipsProps = {
  activeFilter: ExerciseFilterDifficulty
  onChange: (filter: ExerciseFilterDifficulty) => void
}

const FILTERS: ExerciseFilterDifficulty[] = [
  'all',
  'iniciante',
  'intermediario',
  'avancado',
]

export function FunctionalDifficultyFilterChips({
  activeFilter,
  onChange,
}: FunctionalDifficultyFilterChipsProps) {
  function getLabel(filter: ExerciseFilterDifficulty) {
    if (filter === 'all') return 'Qualquer nível'
    return getDifficultyLabel(filter)
  }

  function handlePress(filter: ExerciseFilterDifficulty) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange(filter)
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.wrap}
    >
      {FILTERS.map((filter) => {
        const active = activeFilter === filter

        return (
          <Pressable
            key={filter}
            onPress={() => handlePress(filter)}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
              {getLabel(filter)}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  chipActive: {
    backgroundColor: '#ffedd5',
    borderColor: 'rgba(234, 88, 12, 0.35)',
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: '#c2410c',
    fontWeight: '800',
  },
})

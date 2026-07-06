import * as Haptics from 'expo-haptics'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { colors } from '../../theme/colors'
import type { ExerciseFilterCategory } from '../../types/functionalTraining'
import { getCategoryLabel } from '../../utils/functionalTraining'

type FunctionalCategoryFilterChipsProps = {
  activeFilter: ExerciseFilterCategory
  counts: Record<ExerciseFilterCategory, number>
  onChange: (filter: ExerciseFilterCategory) => void
}

const FILTERS: ExerciseFilterCategory[] = [
  'all',
  'forca',
  'pernas',
  'core',
  'mobilidade',
  'cardio',
]

export function FunctionalCategoryFilterChips({
  activeFilter,
  counts,
  onChange,
}: FunctionalCategoryFilterChipsProps) {
  function getLabel(filter: ExerciseFilterCategory) {
    if (filter === 'all') return 'Todos'
    return getCategoryLabel(filter)
  }

  function handlePress(filter: ExerciseFilterCategory) {
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
            <Text style={[styles.chipCount, active && styles.chipCountActive]}>
              {counts[filter]}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  chipCount: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  chipCountActive: {
    color: '#ea580c',
  },
})

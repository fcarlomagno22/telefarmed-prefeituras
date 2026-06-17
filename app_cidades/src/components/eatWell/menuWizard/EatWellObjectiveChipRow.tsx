import * as Haptics from 'expo-haptics'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import type { EatWellMenuObjective } from '../../../utils/eatWellMenuWizard'
import { MENU_OBJECTIVE_OPTIONS } from '../../../utils/eatWellMenuWizard'
import { colors } from '../../../theme/colors'

type EatWellObjectiveChipRowProps = {
  selected: EatWellMenuObjective | null
  onSelect: (id: EatWellMenuObjective) => void
}

export function EatWellObjectiveChipRow({ selected, onSelect }: EatWellObjectiveChipRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {MENU_OBJECTIVE_OPTIONS.map((option) => {
        const isSelected = selected === option.id

        return (
          <Pressable
            key={option.id}
            onPress={() => {
              void Haptics.selectionAsync()
              onSelect(option.id)
            }}
            style={({ pressed }) => [
              styles.chip,
              isSelected && styles.chipSelected,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  chipSelected: {
    borderColor: 'rgba(132, 204, 22, 0.55)',
    backgroundColor: 'rgba(132, 204, 22, 0.14)',
  },
  chipPressed: {
    opacity: 0.86,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#d9f99d',
  },
})

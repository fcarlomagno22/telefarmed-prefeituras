import * as Haptics from 'expo-haptics'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { colors } from '../../theme/colors'
import { ACTIVE_MIND_CATEGORIES } from '../../config/activeMindGames'
import type { ActiveMindGameCategory } from '../../types/activeMind'

type ActiveMindCategoryChipsProps = {
  selectedCategory: ActiveMindGameCategory
  onCategoryChange: (category: ActiveMindGameCategory) => void
}

export function ActiveMindCategoryChips({
  selectedCategory,
  onCategoryChange,
}: ActiveMindCategoryChipsProps) {
  function handlePress(category: ActiveMindGameCategory) {
    void Haptics.selectionAsync()
    onCategoryChange(category)
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {ACTIVE_MIND_CATEGORIES.map((category) => {
        const selected = category.id === selectedCategory

        return (
          <Pressable
            key={category.id}
            onPress={() => handlePress(category.id)}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && styles.chipPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
              {category.label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipSelected: {
    backgroundColor: 'rgba(244, 114, 182, 0.18)',
    borderColor: 'rgba(244, 114, 182, 0.42)',
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: '#fbcfe8',
  },
})

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { EatWellFoodUnit } from '../../../types/eatWell'
import { FOOD_UNIT_OPTIONS } from '../../../utils/eatWellMealLogWizard'
import { colors } from '../../../theme/colors'

type EatWellMealLogUnitSelectProps = {
  value: EatWellFoodUnit
  onChange: (unit: EatWellFoodUnit) => void
  compact?: boolean
}

export function EatWellMealLogUnitSelect({
  value,
  onChange,
  compact = false,
}: EatWellMealLogUnitSelectProps) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={styles.label}>Unidade</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {FOOD_UNIT_OPTIONS.map((option) => {
          const selected = option.id === value
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange(option.id)}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  wrapCompact: {
    gap: 5,
  },
  label: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 4,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipSelected: {
    backgroundColor: 'rgba(132, 204, 22, 0.16)',
    borderColor: 'rgba(163, 230, 53, 0.45)',
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#d9f99d',
  },
})

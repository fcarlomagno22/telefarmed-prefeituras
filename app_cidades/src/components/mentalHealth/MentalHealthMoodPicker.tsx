import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  MENTAL_HEALTH_MOOD_OPTIONS,
  type MentalHealthMoodLevelId,
} from '../../types/mentalHealth'
import { colors } from '../../theme/colors'
import { MentalHealthMoodIcon } from './MentalHealthMoodIcon'

type MentalHealthMoodPickerProps = {
  selectedMood?: MentalHealthMoodLevelId | null
  onSelect: (mood: MentalHealthMoodLevelId) => void
  variant?: 'compact' | 'drawer'
}

export function MentalHealthMoodPicker({
  selectedMood = null,
  onSelect,
  variant = 'compact',
}: MentalHealthMoodPickerProps) {
  const isDrawer = variant === 'drawer'

  return (
    <View style={[styles.row, isDrawer && styles.rowDrawer]}>
      {MENTAL_HEALTH_MOOD_OPTIONS.map((option) => {
        const selected = selectedMood === option.id

        return (
          <Pressable
            key={option.id}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onSelect(option.id)
            }}
            style={({ pressed }) => [
              styles.option,
              isDrawer && styles.optionDrawer,
              { backgroundColor: selected ? option.tint : 'rgba(255, 255, 255, 0.04)' },
              selected && styles.optionSelected,
              pressed && styles.optionPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
          >
            <MentalHealthMoodIcon mood={option.id} size={isDrawer ? 'drawer' : 'compact'} />
            <Text
              style={[styles.label, isDrawer && styles.labelDrawer, selected && styles.labelSelected]}
              numberOfLines={2}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  rowDrawer: {
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flex: 1,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionDrawer: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 18,
  },
  optionSelected: {
    borderColor: 'rgba(103, 232, 249, 0.42)',
    transform: [{ scale: 1.02 }],
  },
  optionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
  },
  labelDrawer: {
    fontSize: 12,
    lineHeight: 14,
  },
  labelSelected: {
    color: colors.text,
  },
})

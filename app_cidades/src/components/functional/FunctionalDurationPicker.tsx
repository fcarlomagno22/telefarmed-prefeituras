import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import {
  FUNCTIONAL_DURATION_OPTIONS,
  type FunctionalDurationSec,
} from '../../types/functionalTraining'

type FunctionalDurationPickerProps = {
  value: FunctionalDurationSec
  onChange: (value: FunctionalDurationSec) => void
}

export function FunctionalDurationPicker({ value, onChange }: FunctionalDurationPickerProps) {
  function handlePress(duration: FunctionalDurationSec) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange(duration)
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Duração do timer</Text>
      <View style={styles.row}>
        {FUNCTIONAL_DURATION_OPTIONS.map((duration) => {
          const active = value === duration

          return (
            <Pressable
              key={duration}
              onPress={() => handlePress(duration)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {duration}s
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  label: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
    borderColor: 'rgba(251, 146, 60, 0.4)',
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#fed7aa',
  },
})

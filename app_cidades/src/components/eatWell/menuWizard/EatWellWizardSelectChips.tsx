import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'

type EatWellWizardSelectChipsProps = {
  options: string[] | { id: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
  accent?: string
}

function resolveOption(option: string | { id: string; label: string }) {
  if (typeof option === 'string') {
    return { id: option, label: option }
  }
  return option
}

export function EatWellWizardSelectChips({
  options,
  selected,
  onToggle,
  accent = '#84cc16',
}: EatWellWizardSelectChipsProps) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const { id, label } = resolveOption(option)
        const isSelected = selected.includes(id)

        return (
          <Pressable
            key={id}
            onPress={() => {
              void Haptics.selectionAsync()
              onToggle(id)
            }}
            style={({ pressed }) => [
              styles.chip,
              isSelected && { borderColor: `${accent}88`, backgroundColor: `${accent}18` },
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={[styles.chipText, isSelected && { color: accent }]}>{label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  chipPressed: {
    opacity: 0.82,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
})

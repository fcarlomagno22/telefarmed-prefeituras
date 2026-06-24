import { useThemedStyles } from '../../../hooks/useThemedStyles'
import type { ThemeColors } from '../../../theme/palettes'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  areLogicSequenceItemsEqual,
  normalizeLogicSequenceItem,
} from '../../../data/logicSequencePuzzles'
import type { LogicSequenceItem, LogicSequenceItemType } from '../../../types/logicSequence'

type LogicSequenceOptionsGridProps = {
  opcoes: LogicSequenceItem[]
  tipo: LogicSequenceItemType
  selectedOption: LogicSequenceItem | null
  feedbackActive: boolean
  feedbackKind: 'correct' | 'wrong' | null
  disabled?: boolean
  onPickOption: (option: LogicSequenceItem) => void
}

function getOptionFontSize(tipo: LogicSequenceItemType): number {
  if (tipo === 'numero') return 24
  return 28
}

export function LogicSequenceOptionsGrid({
  opcoes,
  tipo,
  selectedOption,
  feedbackActive,
  feedbackKind,
  disabled = false,
  onPickOption,
}: LogicSequenceOptionsGridProps) {
  const styles = useThemedStyles(createStyles)
  const optionFontSize = getOptionFontSize(tipo)

  function handlePickOption(option: LogicSequenceItem) {
    if (disabled) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPickOption(option)
  }

  function getOptionStyle(option: LogicSequenceItem) {
    if (!feedbackActive || selectedOption == null) return null
    if (!areLogicSequenceItemsEqual(option, selectedOption)) return null

    return feedbackKind === 'correct' ? styles.optionCorrect : styles.optionWrong
  }

  return (
    <View style={styles.grid}>
      {opcoes.map((option, index) => {
        const label = normalizeLogicSequenceItem(option)
        const isSelected =
          selectedOption != null && areLogicSequenceItemsEqual(option, selectedOption)

        return (
          <Pressable
            key={`${label}-${index}`}
            onPress={() => handlePickOption(option)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.optionButton,
              isSelected && styles.optionButtonSelected,
              getOptionStyle(option),
              disabled && styles.optionButtonDisabled,
              pressed && !disabled && styles.optionButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Opção ${label}`}
          >
            <Text
              style={[
                styles.optionLabel,
                { fontSize: optionFontSize },
                disabled && styles.optionLabelDisabled,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  optionButton: {
    width: '47%',
    minHeight: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.14)',
    borderColor: 'rgba(139, 92, 246, 0.38)',
  },
  optionButtonPressed: {
    opacity: 0.85,
  },
  optionButtonDisabled: {
    opacity: 0.45,
  },
  optionCorrect: {
    backgroundColor: 'rgba(74, 222, 128, 0.16)',
    borderColor: 'rgba(74, 222, 128, 0.5)',
  },
  optionWrong: {
    backgroundColor: 'rgba(248, 113, 113, 0.16)',
    borderColor: 'rgba(248, 113, 113, 0.5)',
  },
  optionLabel: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: -0.3,
    includeFontPadding: false,
    textAlign: 'center',
  },
  optionLabelDisabled: {
    color: colors.textSubtle,
  },
  })
}

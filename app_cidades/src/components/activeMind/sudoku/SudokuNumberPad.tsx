import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { SudokuCellValue } from '../../../types/sudoku'

type SudokuNumberPadProps = {
  onPickNumber: (value: SudokuCellValue) => void
  buttonHeight: number
  disabled?: boolean
}

const NUMBER_ROWS: SudokuCellValue[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
]

export function SudokuNumberPad({
  onPickNumber,
  buttonHeight,
  disabled = false,
}: SudokuNumberPadProps) {
  const buttonGap = 10

  function handlePickNumber(value: SudokuCellValue) {
    if (disabled) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPickNumber(value)
  }

  return (
    <View style={styles.wrapper}>
      {NUMBER_ROWS.map((row, rowIndex) => (
        <View key={`pad-row-${rowIndex}`} style={[styles.row, { gap: buttonGap }]}>
          {row.map((value) => (
            <Pressable
              key={value}
              onPress={() => handlePickNumber(value)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.numberButton,
                { height: buttonHeight },
                disabled && styles.numberButtonDisabled,
                pressed && !disabled && styles.numberButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Número ${value}`}
            >
              <Text style={[styles.numberLabel, disabled && styles.numberLabelDisabled]}>{value}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
  },
  numberButton: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  numberButtonPressed: {
    opacity: 0.85,
  },
  numberButtonDisabled: {
    opacity: 0.45,
  },
  numberLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
  numberLabelDisabled: {
    color: colors.textSubtle,
  },
})

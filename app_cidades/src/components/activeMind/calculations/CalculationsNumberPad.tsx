import { useThemedStyles } from '../../../hooks/useThemedStyles'
import type { ThemeColors } from '../../../theme/palettes'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'

type CalculationsNumberPadProps = {
  onPickNumber: (value: number) => void
  buttonHeight: number
  disabled?: boolean
}

const NUMBER_ROWS: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [0],
]

export function CalculationsNumberPad({
  onPickNumber,
  buttonHeight,
  disabled = false,
}: CalculationsNumberPadProps) {
  const styles = useThemedStyles(createStyles)
  const buttonGap = 10

  function handlePickNumber(value: number) {
    if (disabled) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPickNumber(value)
  }

  return (
    <View style={styles.wrapper}>
      {NUMBER_ROWS.map((row, rowIndex) => (
        <View
          key={`pad-row-${rowIndex}`}
          style={[
            styles.row,
            row.length === 1 && styles.singleRow,
            { gap: buttonGap },
          ]}
        >
          {row.map((value) => (
            <Pressable
              key={value}
              onPress={() => handlePickNumber(value)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.numberButton,
                row.length === 1 && styles.zeroButton,
                { height: buttonHeight },
                disabled && styles.numberButtonDisabled,
                pressed && !disabled && styles.numberButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Número ${value}`}
            >
              <Text style={[styles.numberLabel, disabled && styles.numberLabelDisabled]}>
                {value}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      width: '100%',
      gap: 10,
    },
    row: {
      flexDirection: 'row',
    },
    singleRow: {
      justifyContent: 'center',
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
    zeroButton: {
      flex: 0,
      width: '33.33%',
    },
    numberButtonPressed: {
      opacity: 0.85,
    },
    numberButtonDisabled: {
      opacity: 0.45,
    },
    numberLabel: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
      includeFontPadding: false,
    },
    numberLabelDisabled: {
      color: colors.textSubtle,
    },
  })
}

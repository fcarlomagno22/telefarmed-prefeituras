import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

type BibleVerseFontControlsProps = {
  fontSize: number
  minSize: number
  maxSize: number
  onDecrease: () => void
  onIncrease: () => void
}

export function BibleVerseFontControls({
  fontSize,
  minSize,
  maxSize,
  onDecrease,
  onIncrease,
}: BibleVerseFontControlsProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => {
          if (fontSize <= minSize) return
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onDecrease()
        }}
        disabled={fontSize <= minSize}
        style={({ pressed }) => [
          styles.button,
          fontSize <= minSize && styles.buttonDisabled,
          pressed && fontSize > minSize && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Diminuir texto"
      >
        <Text style={[styles.buttonLabel, fontSize <= minSize && styles.buttonLabelDisabled]}>
          A-
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          if (fontSize >= maxSize) return
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onIncrease()
        }}
        disabled={fontSize >= maxSize}
        style={({ pressed }) => [
          styles.button,
          fontSize >= maxSize && styles.buttonDisabled,
          pressed && fontSize < maxSize && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Aumentar texto"
      >
        <Text style={[styles.buttonLabel, fontSize >= maxSize && styles.buttonLabelDisabled]}>
          A+
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  button: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  buttonLabelDisabled: {
    color: colors.textSubtle,
  },
  pressed: {
    opacity: 0.82,
  },
})

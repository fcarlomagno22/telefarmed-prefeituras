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
  tone?: 'default' | 'dark'
}

export function BibleVerseFontControls({
  fontSize,
  minSize,
  maxSize,
  onDecrease,
  onIncrease,
  tone = 'default',
}: BibleVerseFontControlsProps) {
  const isDark = tone === 'dark'

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
          isDark && styles.buttonDark,
          fontSize <= minSize && styles.buttonDisabled,
          pressed && fontSize > minSize && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Diminuir texto"
      >
        <Text
          style={[
            styles.buttonLabel,
            isDark && styles.buttonLabelDark,
            fontSize <= minSize && styles.buttonLabelDisabled,
            fontSize <= minSize && isDark && styles.buttonLabelDisabledDark,
          ]}
        >
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
          isDark && styles.buttonDark,
          fontSize >= maxSize && styles.buttonDisabled,
          pressed && fontSize < maxSize && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Aumentar texto"
      >
        <Text
          style={[
            styles.buttonLabel,
            isDark && styles.buttonLabelDark,
            fontSize >= maxSize && styles.buttonLabelDisabled,
            fontSize >= maxSize && isDark && styles.buttonLabelDisabledDark,
          ]}
        >
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
  buttonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  buttonLabelDark: {
    color: '#fafafa',
  },
  buttonLabelDisabledDark: {
    color: 'rgba(255, 255, 255, 0.35)',
  },
  pressed: {
    opacity: 0.82,
  },
})

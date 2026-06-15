import { Ionicons } from '@expo/vector-icons'
import { useRef } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { PASSWORD_RECOVERY_CODE_LENGTH } from '../../config/passwordRecovery'
import { colors } from '../../theme/colors'

type CodeInputProps = {
  value: string
  onChange: (value: string) => void
  error?: boolean
  disabled?: boolean
}

export function CodeInput({ value, onChange, error = false, disabled = false }: CodeInputProps) {
  const inputRef = useRef<TextInput>(null)
  const digits = value.replace(/\D/g, '').slice(0, PASSWORD_RECOVERY_CODE_LENGTH)
  const slots = Array.from({ length: PASSWORD_RECOVERY_CODE_LENGTH }, (_, index) => digits[index] ?? '')

  function handleChange(text: string) {
    onChange(text.replace(/\D/g, '').slice(0, PASSWORD_RECOVERY_CODE_LENGTH))
  }

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.slotsRow} onPress={() => inputRef.current?.focus()}>
        {slots.map((digit, index) => (
          <View
            key={index}
            style={[
              styles.slot,
              error && styles.slotError,
              digit && styles.slotFilled,
              index === digits.length && styles.slotActive,
            ]}
          >
            <Text style={styles.slotText}>{digit}</Text>
          </View>
        ))}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={digits}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={PASSWORD_RECOVERY_CODE_LENGTH}
        editable={!disabled}
        style={styles.hiddenInput}
        autoFocus
      />

      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={styles.focusHint}
        disabled={disabled}
      >
        <Ionicons name="keypad-outline" size={14} color={colors.textMuted} />
        <Text style={styles.focusHintText}>Toque para digitar o código</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  slot: {
    flex: 1,
    minWidth: 0,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotActive: {
    borderColor: 'rgba(255, 107, 0, 0.55)',
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  slotFilled: {
    borderColor: 'rgba(255, 107, 0, 0.35)',
  },
  slotError: {
    borderColor: 'rgba(255, 107, 107, 0.55)',
    backgroundColor: colors.errorBg,
  },
  slotText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  focusHint: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  focusHintText: {
    color: colors.textMuted,
    fontSize: 12,
  },
})

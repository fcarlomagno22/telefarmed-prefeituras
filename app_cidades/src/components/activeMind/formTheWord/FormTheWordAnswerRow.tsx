import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { FormTheWordAnswerSlot } from '../../../types/formTheWord'

type FormTheWordAnswerRowProps = {
  slots: FormTheWordAnswerSlot[]
  totalSlots: number
  feedbackActive: boolean
  feedbackKind: 'correct' | 'wrong' | null
  onRemoveLast: () => void
}

export function FormTheWordAnswerRow({
  slots,
  totalSlots,
  feedbackActive,
  feedbackKind,
  onRemoveLast,
}: FormTheWordAnswerRowProps) {
  function handleRemoveLast() {
    if (slots.length === 0 || feedbackActive) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onRemoveLast()
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {Array.from({ length: totalSlots }).map((_, index) => {
          const slot = slots[index]
          const filled = slot != null

          return (
            <View
              key={`answer-slot-${index}`}
              style={[
                styles.slot,
                filled && styles.slotFilled,
                feedbackActive && feedbackKind === 'correct' && filled && styles.slotCorrect,
                feedbackActive && feedbackKind === 'wrong' && filled && styles.slotWrong,
              ]}
            >
              <Text style={[styles.slotLabel, filled && styles.slotLabelFilled]}>
                {slot?.chunk ?? ''}
              </Text>
            </View>
          )
        })}
      </View>

      <Pressable
        onPress={handleRemoveLast}
        disabled={slots.length === 0 || feedbackActive}
        style={({ pressed }) => [
          styles.backspaceButton,
          (slots.length === 0 || feedbackActive) && styles.backspaceButtonDisabled,
          pressed && slots.length > 0 && !feedbackActive && styles.backspaceButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Apagar última letra"
      >
        <Text style={styles.backspaceLabel}>Apagar</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
  },
  slot: {
    minWidth: 40,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  slotFilled: {
    borderStyle: 'solid',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  slotCorrect: {
    backgroundColor: 'rgba(74, 222, 128, 0.16)',
    borderColor: 'rgba(74, 222, 128, 0.5)',
  },
  slotWrong: {
    backgroundColor: 'rgba(248, 113, 113, 0.16)',
    borderColor: 'rgba(248, 113, 113, 0.5)',
  },
  slotLabel: {
    color: colors.textSubtle,
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  slotLabelFilled: {
    color: colors.text,
  },
  backspaceButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  backspaceButtonPressed: {
    opacity: 0.85,
  },
  backspaceButtonDisabled: {
    opacity: 0.4,
  },
  backspaceLabel: {
    color: '#67e8f9',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})

import { useThemedStyles } from '../../../hooks/useThemedStyles'
import type { ThemeColors } from '../../../theme/palettes'
import { StyleSheet, Text, View } from 'react-native'

type CalculationsAnswerRowProps = {
  answer: string
  feedbackActive: boolean
  feedbackKind: 'correct' | 'wrong' | null
}

export function CalculationsAnswerRow({
  answer,
  feedbackActive,
  feedbackKind,
}: CalculationsAnswerRowProps) {
  const styles = useThemedStyles(createStyles)
  const hasAnswer = answer.length > 0

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Text style={styles.equals}>=</Text>

        <View
          style={[
            styles.answerSlot,
            hasAnswer && styles.answerSlotFilled,
            feedbackActive && feedbackKind === 'correct' && styles.answerSlotCorrect,
            feedbackActive && feedbackKind === 'wrong' && styles.answerSlotWrong,
          ]}
        >
          {hasAnswer ? (
            <Text style={styles.answerText}>{answer}</Text>
          ) : (
            <Text style={styles.answerPlaceholder}>?</Text>
          )}
        </View>
      </View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    equals: {
      color: '#93c5fd',
      fontSize: 28,
      fontWeight: '800',
      includeFontPadding: false,
    },
    answerSlot: {
      minWidth: 72,
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      borderStyle: 'dashed',
    },
    answerSlotFilled: {
      borderStyle: 'solid',
      backgroundColor: 'rgba(37, 99, 235, 0.12)',
      borderColor: 'rgba(37, 99, 235, 0.35)',
    },
    answerSlotCorrect: {
      backgroundColor: 'rgba(74, 222, 128, 0.16)',
      borderColor: 'rgba(74, 222, 128, 0.5)',
    },
    answerSlotWrong: {
      backgroundColor: 'rgba(248, 113, 113, 0.16)',
      borderColor: 'rgba(248, 113, 113, 0.5)',
    },
    answerText: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.3,
      includeFontPadding: false,
    },
    answerPlaceholder: {
      color: colors.textSubtle,
      fontSize: 24,
      fontWeight: '700',
      includeFontPadding: false,
    },
  })
}

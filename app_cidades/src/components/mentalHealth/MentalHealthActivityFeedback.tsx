import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { ActivityFeedbackKey } from '../../mentalHealthEngine/renderCopyEngine'
import { getFeedbackPrompt } from '../../mentalHealthEngine/renderCopyEngine'
import { colors } from '../../theme/colors'

export const MENTAL_HEALTH_ACTIVITY_FEEDBACK_OPTIONS: {
  key: ActivityFeedbackKey
  label: string
}[] = [
  { key: 'helpful', label: 'Sim, ajudou' },
  { key: 'somewhat', label: 'Um pouco' },
  { key: 'not_helpful', label: 'Não ajudou' },
  { key: 'made_worse', label: 'Piorou' },
]

type MentalHealthActivityFeedbackProps = {
  activityId: string
  planDate: string
  promptOverride?: string | null
  submitting?: boolean
  onSelect: (feedback: ActivityFeedbackKey) => void
}

export function MentalHealthActivityFeedback({
  activityId,
  planDate,
  promptOverride,
  submitting = false,
  onSelect,
}: MentalHealthActivityFeedbackProps) {
  const prompt = promptOverride ?? getFeedbackPrompt(activityId, planDate)

  return (
    <View style={styles.wrap}>
      <Text style={styles.prompt}>{prompt}</Text>
      <View style={styles.options}>
        {MENTAL_HEALTH_ACTIVITY_FEEDBACK_OPTIONS.map((option) => (
          <Pressable
            key={option.key}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={`Avaliar atividade: ${option.label}`}
            accessibilityState={{ disabled: submitting }}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onSelect(option.key)
            }}
            style={({ pressed }) => [styles.chip, pressed && !submitting && styles.chipPressed]}
          >
            <Text style={styles.chipText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  prompt: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'center',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
})

import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  type MentalHealthCheckInCardData,
  type MentalHealthMoodLevelId,
} from '../../types/mentalHealth'
import { colors } from '../../theme/colors'
import {
  buildCheckInSummarySentence,
  buildCheckInSupportMessage,
} from '../../utils/mentalHealthCheckIn'
import { MentalHealthMoodIcon } from './MentalHealthMoodIcon'
import { MentalHealthMoodPicker } from './MentalHealthMoodPicker'

type MentalHealthCheckInCardProps = {
  checkInCard: MentalHealthCheckInCardData
  onQuickMoodSelect: (mood: MentalHealthMoodLevelId) => void
  onAnswerQuickQuestions: () => void
  onViewRecentRecords: () => void
  onCreateMicroPlan: () => void
}

function CardShell({
  children,
  variant = 'default',
}: {
  children: ReactNode
  variant?: 'default' | 'change'
}) {
  return (
    <LinearGradient
      colors={
        variant === 'change'
          ? ['rgba(8, 145, 178, 0.18)', 'rgba(251, 191, 36, 0.06)', 'rgba(14, 14, 20, 0.55)']
          : ['rgba(8, 145, 178, 0.2)', 'rgba(8, 145, 178, 0.08)', 'rgba(14, 14, 20, 0.55)']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, variant === 'change' && styles.cardChange]}
    >
      {children}
    </LinearGradient>
  )
}

function ActionPairButtons({
  primaryLabel,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
}: {
  primaryLabel: string
  secondaryLabel: string
  onPrimaryPress: () => void
  onSecondaryPress: () => void
}) {
  return (
    <View style={styles.actionPair}>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onPrimaryPress()
        }}
        style={({ pressed }) => [styles.actionPrimary, pressed && styles.actionPressed]}
      >
        <Text style={styles.actionPrimaryText}>{primaryLabel}</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onSecondaryPress()
        }}
        style={({ pressed }) => [styles.actionSecondary, pressed && styles.actionPressed]}
      >
        <Text style={styles.actionSecondaryText}>{secondaryLabel}</Text>
      </Pressable>
    </View>
  )
}

export function MentalHealthCheckInCard({
  checkInCard,
  onQuickMoodSelect,
  onAnswerQuickQuestions,
  onViewRecentRecords,
  onCreateMicroPlan,
}: MentalHealthCheckInCardProps) {
  if (checkInCard.state === 'pending') {
    return (
      <CardShell>
        <Text style={styles.title}>Como você está hoje?</Text>

        <MentalHealthMoodPicker onSelect={onQuickMoodSelect} />

        <Text style={styles.hint}>Toque no rostinho que mostra como você está.</Text>
      </CardShell>
    )
  }

  const entry = checkInCard.latestEntry
  if (!entry) return null

  if (checkInCard.state === 'relevant-change') {
    return (
      <CardShell variant="change">
        <View style={styles.changeHero}>
          <MentalHealthMoodIcon mood={entry.mood} size="hero" />
          <View style={styles.changeHeroCopy}>
            <Text style={styles.changeTitle}>Percebemos uma mudança no seu momento</Text>
            <Text style={styles.changeMessage}>{checkInCard.relevantChangeMessage}</Text>
          </View>
        </View>

        <ActionPairButtons
          primaryLabel="Posso entender mais?"
          secondaryLabel="Ver registros recentes"
          onPrimaryPress={onAnswerQuickQuestions}
          onSecondaryPress={onViewRecentRecords}
        />
      </CardShell>
    )
  }

  const summarySentence = buildCheckInSummarySentence(entry)
  const supportMessage = buildCheckInSupportMessage(entry)

  return (
    <CardShell>
      <View style={styles.completedBody}>
        <View style={styles.completedEmojiWrap}>
          <MentalHealthMoodIcon mood={entry.mood} size="hero" />
        </View>

        <Text style={styles.summarySentence}>{summarySentence}</Text>

        <View style={styles.summaryDividerRow}>
          <View style={styles.summaryDivider} />
        </View>

        <Text style={styles.supportMessage}>{supportMessage}</Text>

        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            onCreateMicroPlan()
          }}
          style={({ pressed }) => [styles.microPlanCallout, pressed && styles.actionPressed]}
          accessibilityRole="button"
          accessibilityLabel="Criar plano de micro atividades"
        >
          <View style={styles.microPlanCopy}>
            <Text style={styles.microPlanTitle}>
              Quer criar um plano de micro atividades?
            </Text>
            <Text style={styles.microPlanSubtitle}>
              Pequenos passos para ajudar você a lidar com o que aconteceu.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(103, 232, 249, 0.75)" />
        </Pressable>
      </View>
    </CardShell>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(8, 145, 178, 0.28)',
  },
  cardChange: {
    borderColor: 'rgba(103, 232, 249, 0.32)',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.35,
    lineHeight: 24,
  },
  hint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    textAlign: 'center',
    marginTop: -4,
  },
  completedBody: {
    gap: 14,
  },
  completedEmojiWrap: {
    alignItems: 'center',
    width: '100%',
  },
  summarySentence: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  summaryDividerRow: {
    alignItems: 'flex-end',
    paddingVertical: 2,
  },
  summaryDivider: {
    width: 52,
    height: 1,
    backgroundColor: 'rgba(103, 232, 249, 0.28)',
  },
  supportMessage: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 21,
  },
  microPlanCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(8, 145, 178, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.2)',
  },
  microPlanCopy: {
    flex: 1,
    gap: 4,
  },
  microPlanTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  microPlanSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  changeHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  changeHeroCopy: {
    flex: 1,
    gap: 4,
  },
  changeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  changeMessage: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  actionPair: {
    flexDirection: 'row',
    gap: 8,
  },
  actionPrimary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(8, 145, 178, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.28)',
  },
  actionSecondary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionPressed: {
    opacity: 0.88,
  },
  actionPrimaryText: {
    color: '#a5f3fc',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
  actionSecondaryText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
})

import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { ActivityFeedbackKey } from '../../mentalHealthEngine/renderCopyEngine'
import {
  getCtaLabel,
  getFeedbackPrompt,
  renderFeedbackThankYou,
} from '../../mentalHealthEngine/renderCopyEngine'
import type { DailyMicroPlan, UserClinicalState } from '../../types/mentalHealthEngine'
import { colors } from '../../theme/colors'

type MentalHealthMicroPlanDrawerProps = {
  visible: boolean
  loading: boolean
  plan: DailyMicroPlan | null
  errorMessage: string | null
  activityHistory?: UserClinicalState['activity_history']
  onClose: () => void
  onActivityComplete?: (activityId: string, planDate: string) => Promise<void> | void
  onActivityFeedback?: (
    activityId: string,
    planDate: string,
    feedback: ActivityFeedbackKey,
  ) => Promise<void> | void
}

function slotLabel(slot: string) {
  if (slot === 'now') return 'Para agora'
  if (slot === 'daytime') return 'Durante o dia'
  if (slot === 'evening') return 'À noite'
  return slot
}

const FEEDBACK_OPTIONS: { key: ActivityFeedbackKey; label: string }[] = [
  { key: 'helpful', label: 'Sim, ajudou' },
  { key: 'somewhat', label: 'Um pouco' },
  { key: 'not_helpful', label: 'Não ajudou' },
  { key: 'made_worse', label: 'Piorou' },
]

export function MentalHealthMicroPlanDrawer({
  visible,
  loading,
  plan,
  errorMessage,
  activityHistory = [],
  onClose,
  onActivityComplete,
  onActivityFeedback,
}: MentalHealthMicroPlanDrawerProps) {
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null)
  const [feedbackActivityId, setFeedbackActivityId] = useState<string | null>(null)
  const [thankYouMessage, setThankYouMessage] = useState<string | null>(null)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  useEffect(() => {
    if (!visible) {
      setExpandedActivityId(null)
      setFeedbackActivityId(null)
      setThankYouMessage(null)
      setSubmittingFeedback(false)
    }
  }, [visible])

  if (!visible) return null

  function getActivityStatus(activityId: string, planDate: string) {
    const entry = activityHistory.find(
      (item) => item.activity_id === activityId && item.plan_date === planDate,
    )
    return entry?.status ?? 'assigned'
  }

  function getActivityFeedback(activityId: string, planDate: string) {
    const entry = activityHistory.find(
      (item) => item.activity_id === activityId && item.plan_date === planDate,
    )
    return entry?.feedback ?? null
  }

  async function handleComplete(activityId: string, planDate: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await onActivityComplete?.(activityId, planDate)
    setFeedbackActivityId(activityId)
    setThankYouMessage(null)
  }

  async function handleFeedback(
    activityId: string,
    planDate: string,
    feedback: ActivityFeedbackKey,
  ) {
    setSubmittingFeedback(true)
    try {
      await onActivityFeedback?.(activityId, planDate, feedback)
      setThankYouMessage(renderFeedbackThankYou(feedback, activityId, planDate))
      setFeedbackActivityId(null)
      setExpandedActivityId(null)
    } finally {
      setSubmittingFeedback(false)
    }
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <LinearGradient colors={['#0f172a', '#111827', '#0b0b10']} style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Plano de micro atividades</Text>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onClose()
            }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Montando seu plano de hoje...</Text>
            </View>
          ) : null}

          {!loading && errorMessage ? (
            <View style={styles.messageBlock}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {!loading && plan ? (
            <>
              <View style={styles.messageBlock}>
                <Text style={styles.planTitle}>{plan.welcome.title}</Text>
                <Text style={styles.planBody}>{plan.welcome.body}</Text>
              </View>

              {plan.blocked ? (
                <View style={styles.blockedCard}>
                  <Ionicons name="heart-outline" size={22} color="#fca5a5" />
                  <Text style={styles.blockedText}>
                    Neste momento, o melhor passo é buscar apoio humano. Ligue 188 (CVV) se
                    precisar conversar com alguém agora.
                  </Text>
                </View>
              ) : null}

              {plan.activities.map((activity) => {
                const status = getActivityStatus(activity.activity_id, plan.plan_date)
                const feedback = getActivityFeedback(activity.activity_id, plan.plan_date)
                const isExpanded = expandedActivityId === activity.activity_id
                const isFeedbackStep = feedbackActivityId === activity.activity_id

                return (
                  <View key={`${activity.slot}-${activity.activity_id}`} style={styles.activityCard}>
                    <Pressable
                      onPress={() =>
                        setExpandedActivityId(isExpanded ? null : activity.activity_id)
                      }
                    >
                      <View style={styles.activityHeader}>
                        <Text style={styles.slotLabel}>{slotLabel(activity.slot)}</Text>
                        <Text style={styles.statusBadge}>
                          {feedback
                            ? 'Concluída'
                            : status === 'completed'
                              ? 'Concluída'
                              : status === 'started'
                                ? 'Em andamento'
                                : 'Pendente'}
                        </Text>
                      </View>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      {activity.subtitle_user ? (
                        <Text style={styles.activitySubtitle}>{activity.subtitle_user}</Text>
                      ) : null}
                      <Text style={styles.activityMeta}>
                        {activity.duration_min} min · {activity.objective_user}
                      </Text>
                    </Pressable>

                    {isExpanded ? (
                      <View style={styles.expandedBlock}>
                        {activity.why_user_moment ? (
                          <Text style={styles.activityWhy}>{activity.why_user_moment}</Text>
                        ) : null}

                        {!feedback && status !== 'completed' && !isFeedbackStep ? (
                          <Pressable
                            onPress={() =>
                              void handleComplete(activity.activity_id, plan.plan_date)
                            }
                            style={styles.primaryAction}
                          >
                            <Text style={styles.primaryActionText}>
                              {getCtaLabel('finish_activity', 'Concluir atividade')}
                            </Text>
                          </Pressable>
                        ) : null}

                        {isFeedbackStep ? (
                          <View style={styles.feedbackBlock}>
                            <Text style={styles.feedbackPrompt}>
                              {getFeedbackPrompt(activity.activity_id, plan.plan_date)}
                            </Text>
                            <View style={styles.feedbackOptions}>
                              {FEEDBACK_OPTIONS.map((option) => (
                                <Pressable
                                  key={option.key}
                                  disabled={submittingFeedback}
                                  onPress={() =>
                                    void handleFeedback(
                                      activity.activity_id,
                                      plan.plan_date,
                                      option.key,
                                    )
                                  }
                                  style={styles.feedbackChip}
                                >
                                  <Text style={styles.feedbackChipText}>{option.label}</Text>
                                </Pressable>
                              ))}
                            </View>
                          </View>
                        ) : null}

                        {feedback ? (
                          <Text style={styles.feedbackDone}>
                            Obrigado por contar como foi.
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                )
              })}

              {thankYouMessage ? (
                <View style={styles.footerCard}>
                  <Text style={styles.footerTitle}>Obrigado pelo retorno</Text>
                  <Text style={styles.footerBody}>{thankYouMessage}</Text>
                </View>
              ) : null}

              {plan.completion && !thankYouMessage ? (
                <View style={styles.footerCard}>
                  <Text style={styles.footerTitle}>{plan.completion.title}</Text>
                  <Text style={styles.footerBody}>{plan.completion.body}</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  loadingBlock: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  messageBlock: {
    gap: 8,
  },
  planTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  planBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    lineHeight: 20,
  },
  blockedCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  blockedText: {
    flex: 1,
    color: '#fecaca',
    fontSize: 14,
    lineHeight: 20,
  },
  activityCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  slotLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusBadge: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  activityTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  activitySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
  activityMeta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  expandedBlock: {
    marginTop: 10,
    gap: 10,
  },
  activityWhy: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  primaryAction: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(8, 145, 178, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.28)',
  },
  primaryActionText: {
    color: '#a5f3fc',
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackBlock: {
    gap: 10,
    paddingTop: 4,
  },
  feedbackPrompt: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  feedbackOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feedbackChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  feedbackChipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  feedbackDone: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  footerCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(8, 145, 178, 0.12)',
    gap: 6,
  },
  footerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  footerBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
})

import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppModal } from '../AppModal'
import type { ActivityFeedbackKey } from '../../mentalHealthEngine/renderCopyEngine'
import { getCtaLabel, renderFeedbackThankYou } from '../../mentalHealthEngine/renderCopyEngine'
import type { DailyMicroPlan, UserClinicalState } from '../../types/mentalHealthEngine'
import { colors } from '../../theme/colors'
import { getCatalogActivity } from '../../utils/mentalHealthActivityCatalog'
import { MentalHealthActivityFeedback } from './MentalHealthActivityFeedback'

type PlanSlot = 'now' | 'daytime' | 'evening'

type MentalHealthMicroPlanDrawerProps = {
  visible: boolean
  loading: boolean
  plan: DailyMicroPlan | null
  errorMessage: string | null
  activityHistory?: UserClinicalState['activity_history']
  onClose: () => void
  onActivityStart?: (activityId: string, planDate: string) => void
  onActivityFeedback?: (
    activityId: string,
    planDate: string,
    feedback: ActivityFeedbackKey,
  ) => Promise<void> | void
  onOpenCrisisSupport?: () => void
}

const SLOT_ORDER: PlanSlot[] = ['now', 'daytime', 'evening']

const SLOT_META: Record<
  PlanSlot,
  { label: string; hint: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  now: {
    label: 'Para agora',
    hint: 'Um primeiro passo leve neste momento',
    icon: 'sparkles-outline',
  },
  daytime: {
    label: 'Durante o dia',
    hint: 'Quando fizer sentido na sua rotina',
    icon: 'sunny-outline',
  },
  evening: {
    label: 'À noite',
    hint: 'Para desacelerar e fechar o dia',
    icon: 'moon-outline',
  },
}

type ActivityAction = 'start' | 'evaluate' | 'done'

function resolveActivityAction(
  status: string,
  feedback: string | null,
  hasCatalogSteps: boolean,
): ActivityAction | null {
  if (feedback) return 'done'
  if (status === 'completed') return 'evaluate'
  if (hasCatalogSteps) return 'start'
  return null
}

function statusLabel(action: ActivityAction | null, status: string) {
  if (action === 'done') return 'Concluído'
  if (action === 'evaluate') return 'Avaliar'
  if (status === 'started') return 'Em andamento'
  return 'Pendente'
}

export function MentalHealthMicroPlanDrawer({
  visible,
  loading,
  plan,
  errorMessage,
  activityHistory = [],
  onClose,
  onActivityStart,
  onActivityFeedback,
  onOpenCrisisSupport,
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

  const activitiesBySlot = useMemo(() => {
    const groups: Record<PlanSlot, DailyMicroPlan['activities']> = {
      now: [],
      daytime: [],
      evening: [],
    }

    for (const activity of plan?.activities ?? []) {
      const slot = activity.slot as PlanSlot
      if (groups[slot]) {
        groups[slot].push(activity)
      } else {
        groups.now.push(activity)
      }
    }

    return groups
  }, [plan?.activities])

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

  function handleStart(activityId: string, planDate: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onActivityStart?.(activityId, planDate)
  }

  function handleEvaluatePress(activityId: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setFeedbackActivityId(activityId)
    setExpandedActivityId(activityId)
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
    } finally {
      setSubmittingFeedback(false)
    }
  }

  function handleCrisisPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
    onOpenCrisisSupport?.()
  }

  return (
    <AppModal
      visible={visible}
      transparent
      animationType="none"
      navBarUnderlayColor="#0b0b10"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <LinearGradient colors={['#0f172a', '#111827', '#0b0b10']} style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Seus cuidados de hoje</Text>
            <Text style={styles.headerSubtitle}>
              {loading
                ? 'Preparando sugestões leves para você'
                : plan?.welcome.body ?? 'Pequenos passos, no seu ritmo'}
            </Text>
          </View>
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
              <Text style={styles.loadingText}>Montando seus cuidados de hoje...</Text>
            </View>
          ) : null}

          {!loading && errorMessage ? (
            <View style={styles.messageBlock}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {!loading && plan ? (
            <>
              {plan.blocked ? (
                <Pressable
                  onPress={handleCrisisPress}
                  style={({ pressed }) => [styles.blockedCard, pressed && styles.pressed]}
                >
                  <View style={styles.blockedIconWrap}>
                    <Ionicons name="heart-outline" size={24} color="#fda4af" />
                  </View>
                  <View style={styles.blockedTextWrap}>
                    <Text style={styles.blockedTitle}>{plan.welcome.title}</Text>
                    <Text style={styles.blockedText}>{plan.welcome.body}</Text>
                  </View>
                  <View style={styles.blockedCta}>
                    <Text style={styles.blockedCtaText}>Ver opções de apoio</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fecdd3" />
                  </View>
                </Pressable>
              ) : (
                <>
                  <View style={styles.welcomeCard}>
                    <Text style={styles.planTitle}>{plan.welcome.title}</Text>
                    <Text style={styles.planBody}>{plan.welcome.body}</Text>
                  </View>

                  {SLOT_ORDER.map((slot) => {
                  const activities = activitiesBySlot[slot]
                  if (!activities.length) return null

                  const meta = SLOT_META[slot]

                  return (
                    <View key={slot} style={styles.slotSection}>
                      <View
                        style={[
                          styles.slotHeader,
                          slot === 'now' && styles.slotHeaderNow,
                          slot === 'evening' && styles.slotHeaderEvening,
                        ]}
                      >
                        <View
                          style={[
                            styles.slotIconWrap,
                            slot === 'now' && styles.slotIconWrapNow,
                            slot === 'evening' && styles.slotIconWrapEvening,
                          ]}
                        >
                          <Ionicons
                            name={meta.icon}
                            size={16}
                            color={slot === 'now' ? '#67e8f9' : slot === 'evening' ? '#c4b5fd' : '#fbbf24'}
                          />
                        </View>
                        <View style={styles.slotHeaderText}>
                          <Text
                            style={[
                              styles.slotTitle,
                              slot === 'now' && styles.slotTitleNow,
                            ]}
                          >
                            {meta.label}
                          </Text>
                          <Text style={styles.slotHint}>{meta.hint}</Text>
                        </View>
                      </View>

                      {activities.map((activity) => {
                        const status = getActivityStatus(activity.activity_id, plan.plan_date)
                        const feedback = getActivityFeedback(activity.activity_id, plan.plan_date)
                        const isExpanded = expandedActivityId === activity.activity_id
                        const isFeedbackStep = feedbackActivityId === activity.activity_id
                        const hasCatalogSteps = getCatalogActivity(activity.activity_id) != null
                        const action = resolveActivityAction(status, feedback, hasCatalogSteps)
                        const badge = statusLabel(action, status)
                        const startLabel =
                          status === 'started'
                            ? getCtaLabel('resume_activity', 'Continuar')
                            : getCtaLabel('start_activity', 'Iniciar')

                        return (
                          <View
                            key={`${activity.slot}-${activity.activity_id}`}
                            style={[
                              styles.activityCard,
                              slot === 'now' && styles.activityCardNow,
                            ]}
                          >
                            <Pressable
                              onPress={() =>
                                setExpandedActivityId(isExpanded ? null : activity.activity_id)
                              }
                            >
                              <View style={styles.activityHeader}>
                                <View
                                  style={[
                                    styles.statusBadge,
                                    action === 'done' && styles.statusBadgeDone,
                                    action === 'evaluate' && styles.statusBadgeEvaluate,
                                    status === 'started' && action === 'start' && styles.statusBadgeStarted,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.statusBadgeText,
                                      action === 'done' && styles.statusBadgeTextDone,
                                      action === 'evaluate' && styles.statusBadgeTextEvaluate,
                                    ]}
                                  >
                                    {badge}
                                  </Text>
                                </View>
                                <Ionicons
                                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                  size={16}
                                  color={colors.textSubtle}
                                />
                              </View>
                              <Text style={styles.activityTitle}>{activity.title}</Text>
                              {activity.subtitle_user ? (
                                <Text style={styles.activitySubtitle}>{activity.subtitle_user}</Text>
                              ) : null}
                              <Text style={styles.activityMeta}>
                                {activity.duration_min} min · {activity.objective_user}
                              </Text>
                            </Pressable>

                            {action === 'start' ? (
                              <Pressable
                                onPress={() => handleStart(activity.activity_id, plan.plan_date)}
                                style={({ pressed }) => [
                                  styles.primaryAction,
                                  slot === 'now' && styles.primaryActionNow,
                                  pressed && styles.pressed,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.primaryActionText,
                                    slot === 'now' && styles.primaryActionTextNow,
                                  ]}
                                >
                                  {startLabel}
                                </Text>
                                <Ionicons
                                  name="play"
                                  size={14}
                                  color={slot === 'now' ? '#1a1208' : '#a5f3fc'}
                                />
                              </Pressable>
                            ) : null}

                            {action === 'evaluate' ? (
                              <Pressable
                                onPress={() => handleEvaluatePress(activity.activity_id)}
                                style={({ pressed }) => [
                                  styles.evaluateAction,
                                  pressed && styles.pressed,
                                ]}
                              >
                                <Text style={styles.evaluateActionText}>
                                  {getCtaLabel('rate_activity', 'Avaliar')}
                                </Text>
                                <Ionicons name="chatbubble-ellipses-outline" size={14} color="#e9d5ff" />
                              </Pressable>
                            ) : null}

                            {action === 'done' ? (
                              <View style={styles.doneRow}>
                                <Ionicons name="checkmark-circle" size={16} color="#86efac" />
                                <Text style={styles.doneText}>Obrigado por contar como foi.</Text>
                              </View>
                            ) : null}

                            {isExpanded ? (
                              <View style={styles.expandedBlock}>
                                {activity.why_user_moment ? (
                                  <Text style={styles.activityWhy}>{activity.why_user_moment}</Text>
                                ) : null}
                              </View>
                            ) : null}

                            {isFeedbackStep ? (
                              <MentalHealthActivityFeedback
                                activityId={activity.activity_id}
                                planDate={plan.plan_date}
                                submitting={submittingFeedback}
                                onSelect={(key) =>
                                  void handleFeedback(activity.activity_id, plan.plan_date, key)
                                }
                              />
                            ) : null}
                          </View>
                        )
                      })}
                    </View>
                  )
                })}
                </>
              )}

              {thankYouMessage ? (
                <View style={styles.footerCard}>
                  <Text style={styles.footerTitle}>Obrigado pelo retorno</Text>
                  <Text style={styles.footerBody}>{thankYouMessage}</Text>
                </View>
              ) : null}

              {plan.completion && !thankYouMessage && !plan.blocked ? (
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
    </AppModal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
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
    gap: 16,
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
  welcomeCard: {
    gap: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.18)',
  },
  planTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
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
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.28)',
  },
  blockedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
  },
  blockedTextWrap: {
    gap: 6,
  },
  blockedTitle: {
    color: '#fecdd3',
    fontSize: 17,
    fontWeight: '700',
  },
  blockedText: {
    color: '#fda4af',
    fontSize: 14,
    lineHeight: 20,
  },
  blockedCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.32)',
  },
  blockedCtaText: {
    color: '#fecdd3',
    fontSize: 14,
    fontWeight: '700',
  },
  slotSection: {
    gap: 10,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  slotHeaderNow: {
    paddingBottom: 2,
  },
  slotHeaderEvening: {
    opacity: 0.95,
  },
  slotIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.22)',
  },
  slotIconWrapNow: {
    backgroundColor: 'rgba(8, 145, 178, 0.16)',
    borderColor: 'rgba(103, 232, 249, 0.28)',
  },
  slotIconWrapEvening: {
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
    borderColor: 'rgba(196, 181, 253, 0.24)',
  },
  slotHeaderText: {
    flex: 1,
    gap: 2,
  },
  slotTitle: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  slotTitleNow: {
    color: '#67e8f9',
  },
  slotHint: {
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 16,
  },
  activityCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  activityCardNow: {
    backgroundColor: 'rgba(8, 145, 178, 0.08)',
    borderColor: 'rgba(103, 232, 249, 0.2)',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statusBadgeStarted: {
    backgroundColor: 'rgba(8, 145, 178, 0.14)',
    borderColor: 'rgba(103, 232, 249, 0.24)',
  },
  statusBadgeEvaluate: {
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
    borderColor: 'rgba(196, 181, 253, 0.28)',
  },
  statusBadgeDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(134, 239, 172, 0.28)',
  },
  statusBadgeText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusBadgeTextDone: {
    color: '#86efac',
  },
  statusBadgeTextEvaluate: {
    color: '#e9d5ff',
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
    gap: 10,
  },
  activityWhy: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(8, 145, 178, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.28)',
  },
  primaryActionNow: {
    backgroundColor: '#ffb86a',
    borderColor: 'rgba(255, 184, 106, 0.5)',
  },
  primaryActionText: {
    color: '#a5f3fc',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryActionTextNow: {
    color: '#1a1208',
  },
  evaluateAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.28)',
  },
  evaluateActionText: {
    color: '#e9d5ff',
    fontSize: 14,
    fontWeight: '700',
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  doneText: {
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
  pressed: {
    opacity: 0.88,
  },
})

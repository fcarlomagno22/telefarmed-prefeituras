import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useMemo } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { DailyMicroPlan, UserClinicalState } from '../../types/mentalHealthEngine'
import type { MentalHealthCheckInEntry } from '../../types/mentalHealth'
import { colors } from '../../theme/colors'
import { getCatalogActivity } from '../../utils/mentalHealthActivityCatalog'
import {
  formatMentalHealthEmotions,
  getMentalHealthCheckInMoodLabel,
} from '../../utils/mentalHealthCheckIn'
import { PrimaryButton } from '../PrimaryButton'
import { MentalHealthMoodIcon } from './MentalHealthMoodIcon'

type PlanSlot = 'now' | 'daytime' | 'evening'

const SLOT_LABELS: Record<PlanSlot, string> = {
  now: 'Para agora',
  daytime: 'Durante o dia',
  evening: 'À noite',
}

type MentalHealthCareTabProps = {
  bottomPadding: number
  planDate: string
  microPlan: DailyMicroPlan | null
  microPlanLoading: boolean
  hasCheckInToday: boolean
  todayCheckIn: MentalHealthCheckInEntry | null
  activityHistory: UserClinicalState['activity_history']
  crisisBlocksPlan: boolean
  onCreateDailyPlan: () => void
  onOpenActivityDetail: (activityId: string) => void
  onStartActivity: (activityId: string) => void
  onOpenCrisisSupport: () => void
  onFeelingBetter?: () => void
}

function TodayCheckInSnapshot({ entry }: { entry: MentalHealthCheckInEntry }) {
  const moodLabel = getMentalHealthCheckInMoodLabel(entry.mood)
  const emotions = formatMentalHealthEmotions(entry.emotions)
  const hasEmotions = entry.emotions.length > 0 && emotions !== '—'

  return (
    <View style={styles.checkInSnapshot}>
      <View style={styles.checkInMoodIconWrap}>
        <MentalHealthMoodIcon mood={entry.mood} size="snapshot" />
      </View>
      <View style={styles.checkInSnapshotText}>
        <Text style={styles.checkInSnapshotPrimary}>
          {moodLabel}
          {hasEmotions ? ` · ${emotions}` : ''}
        </Text>
        {entry.mainInfluence ? (
          <Text style={styles.checkInSnapshotSecondary} numberOfLines={1}>
            Influência: {entry.mainInfluence}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

function getActivityProgress(
  activityId: string,
  planDate: string,
  activityHistory: UserClinicalState['activity_history'],
) {
  const entry = activityHistory.find(
    (item) => item.activity_id === activityId && item.plan_date === planDate,
  )
  const isDone = entry?.status === 'completed' || entry?.feedback != null
  const isStarted = entry?.status === 'started'
  return { isDone, isStarted }
}

function PlanActivityCard({
  activity,
  planDate,
  activityHistory,
  onPress,
  onStart,
}: {
  activity: DailyMicroPlan['activities'][number]
  planDate: string
  activityHistory: UserClinicalState['activity_history']
  onPress: () => void
  onStart: () => void
}) {
  const slot = activity.slot as PlanSlot
  const { isDone, isStarted } = getActivityProgress(activity.activity_id, planDate, activityHistory)
  const canStart = !isDone && getCatalogActivity(activity.activity_id) != null

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.activityCard, pressed && styles.pressed]}
    >
      <View style={styles.activityCardTop}>
        <View style={styles.activityCardBody}>
          <Text style={styles.activityMeta}>{SLOT_LABELS[slot] ?? activity.slot}</Text>
          <Text style={styles.activityTitle}>{activity.title}</Text>
        </View>

        {canStart ? (
          <Pressable
            onPress={(event) => {
              event.stopPropagation()
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onStart()
            }}
            hitSlop={6}
            style={({ pressed }) => [styles.startAction, pressed && styles.pressed]}
          >
            <Ionicons name="play" size={14} color="#ffb86a" />
            <Text style={styles.startActionText}>{isStarted ? 'Continuar' : 'Iniciar'}</Text>
          </Pressable>
        ) : isDone ? (
          <View style={styles.doneBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#86efac" />
            <Text style={styles.doneBadgeText}>Feita</Text>
          </View>
        ) : null}
      </View>

      {activity.subtitle_user ? (
        <Text style={styles.activitySubtitle} numberOfLines={2}>
          {activity.subtitle_user}
        </Text>
      ) : null}
      {activity.why_user_moment ? (
        <Text style={styles.activityWhy} numberOfLines={2}>
          {activity.why_user_moment}
        </Text>
      ) : null}
      <View style={styles.activityFooter}>
        <Text style={styles.activityDuration}>{activity.duration_min} min</Text>
        {isStarted && !isDone ? <Text style={styles.statusHint}>Em andamento</Text> : null}
      </View>
    </Pressable>
  )
}

export function MentalHealthCareTab({
  bottomPadding,
  planDate,
  microPlan,
  microPlanLoading,
  hasCheckInToday,
  todayCheckIn,
  activityHistory,
  crisisBlocksPlan,
  onCreateDailyPlan,
  onOpenActivityDetail,
  onStartActivity,
  onOpenCrisisSupport,
  onFeelingBetter,
}: MentalHealthCareTabProps) {
  const planActivities = useMemo(() => {
    if (!microPlan || microPlan.blocked || crisisBlocksPlan) return []
    return [...microPlan.activities].sort((left, right) => left.order - right.order)
  }, [crisisBlocksPlan, microPlan])

  const completedCount = useMemo(
    () =>
      planActivities.filter(
        (activity) => getActivityProgress(activity.activity_id, planDate, activityHistory).isDone,
      ).length,
    [activityHistory, planActivities, planDate],
  )

  const allPlanDone = planActivities.length > 0 && completedCount === planActivities.length
  const showEmptyState = !crisisBlocksPlan && !hasCheckInToday
  const showPlan = !crisisBlocksPlan && hasCheckInToday && planActivities.length > 0
  const showPlanPending =
    !crisisBlocksPlan && hasCheckInToday && !microPlanLoading && planActivities.length === 0

  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Cuidar</Text>
        <Text style={styles.heroTitle}>Seu plano{'\n'}de cuidados</Text>
        <Text style={styles.heroBody}>
          Com base em como você está hoje, montamos micro-tarefas guiadas para o seu dia.
        </Text>
        {todayCheckIn ? <TodayCheckInSnapshot entry={todayCheckIn} /> : null}
      </View>

      {crisisBlocksPlan ? (
        <View style={styles.crisisCard}>
          <Ionicons name="heart-outline" size={22} color="#fda4af" />
          <View style={styles.crisisCardText}>
            <Text style={styles.crisisTitle}>Apoio antes das atividades</Text>
            <Text style={styles.crisisBody}>
              As sugestões autoguiadas estão pausadas. O melhor passo agora é falar com alguém.
            </Text>
          </View>
          <Pressable
            onPress={onOpenCrisisSupport}
            style={({ pressed }) => [styles.crisisBtn, pressed && styles.pressed]}
          >
            <Text style={styles.crisisBtnText}>Ver opções de apoio</Text>
          </Pressable>
          {onFeelingBetter ? (
            <Pressable
              onPress={onFeelingBetter}
              style={({ pressed }) => [styles.feelingBetterLink, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Estou melhor — retomar cuidados"
            >
              <Text style={styles.feelingBetterLinkText}>Estou melhor</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showEmptyState ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="calendar-outline" size={28} color="#67e8f9" />
          </View>
          <Text style={styles.emptyTitle}>Ainda não há plano para hoje</Text>
          <Text style={styles.emptyBody}>
            Primeiro contamos como você está agora. Em seguida, montamos automaticamente um
            plano de tarefas personalizado para o seu dia.
          </Text>
          <PrimaryButton
            label="Criar plano de tarefas para o seu dia"
            onPress={onCreateDailyPlan}
          />
        </View>
      ) : null}

      {hasCheckInToday && microPlanLoading && !showPlan ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Montando seu plano de hoje…</Text>
        </View>
      ) : null}

      {showPlanPending ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Preparando seu plano</Text>
          <Text style={styles.emptyBody}>
            Seu registro de hoje já foi salvo. Estamos finalizando as tarefas sugeridas — volte
            em instantes ou atualize a tela.
          </Text>
        </View>
      ) : null}

      {showPlan ? (
        <View style={styles.planSection}>
          <Text style={styles.planHeading}>
            {allPlanDone ? 'Tudo feito por hoje' : 'Suas tarefas de hoje'}
          </Text>
          <Text style={styles.planSubheading}>
            {allPlanDone
              ? 'Você concluiu as micro-tarefas sugeridas. Volte amanhã para um novo plano.'
              : `${completedCount} de ${planActivities.length} concluídas`}
          </Text>

          {planActivities.map((activity) => (
            <PlanActivityCard
              key={`${activity.slot}-${activity.activity_id}`}
              activity={activity}
              planDate={planDate}
              activityHistory={activityHistory}
              onPress={() => onOpenActivityDetail(activity.activity_id)}
              onStart={() => onStartActivity(activity.activity_id)}
            />
          ))}

          {allPlanDone && microPlan?.completion ? (
            <View style={styles.completionCard}>
              <Text style={styles.completionTitle}>{microPlan.completion.title}</Text>
              <Text style={styles.completionBody}>{microPlan.completion.body}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    paddingHorizontal: 20,
    gap: 22,
  },
  hero: {
    gap: 10,
  },
  eyebrow: {
    color: 'rgba(103, 232, 249, 0.85)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  heroBody: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    maxWidth: 320,
  },
  checkInSnapshot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    paddingLeft: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    overflow: 'visible',
  },
  checkInMoodIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkInSnapshotText: {
    flex: 1,
    gap: 2,
  },
  checkInSnapshotPrimary: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  checkInSnapshotSecondary: {
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 15,
  },
  crisisCard: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.22)',
  },
  crisisCardText: {
    gap: 4,
  },
  crisisTitle: {
    color: '#fecdd3',
    fontSize: 16,
    fontWeight: '700',
  },
  crisisBody: {
    color: '#fda4af',
    fontSize: 14,
    lineHeight: 20,
  },
  crisisBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(244, 63, 94, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  crisisBtnText: {
    color: '#fda4af',
    fontSize: 13,
    fontWeight: '700',
  },
  feelingBetterLink: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    marginTop: 2,
  },
  feelingBetterLinkText: {
    color: '#86efac',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    gap: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 145, 178, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.22)',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  loadingBlock: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 28,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  planSection: {
    gap: 12,
  },
  planHeading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    paddingTop: 4,
  },
  planSubheading: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -6,
  },
  activityCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  activityCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  activityCardBody: {
    flex: 1,
    gap: 4,
    paddingRight: 4,
  },
  activityMeta: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  activityTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  activitySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  activityWhy: {
    color: '#a5f3fc',
    fontSize: 12,
    lineHeight: 17,
    paddingTop: 2,
  },
  activityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  activityDuration: {
    color: colors.textSubtle,
    fontSize: 12,
  },
  statusHint: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doneBadgeText: {
    color: '#86efac',
    fontSize: 12,
    fontWeight: '700',
  },
  startAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  startActionText: {
    color: '#ffb86a',
    fontSize: 13,
    fontWeight: '700',
  },
  completionCard: {
    gap: 6,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.22)',
    marginTop: 4,
  },
  completionTitle: {
    color: '#bbf7d0',
    fontSize: 15,
    fontWeight: '700',
  },
  completionBody: {
    color: '#86efac',
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.88,
  },
})

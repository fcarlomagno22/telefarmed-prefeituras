import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import type { AppScreen } from '../../types/auth'
import type { MyRoutineDayPlan, MyRoutineTask } from '../../types/myRoutine'
import {
  buildDayHeroPhrase,
  formatTaskScheduleLabel,
  groupTasksByBlock,
  MY_ROUTINE_BLOCK_ORDER,
  MY_ROUTINE_BLOCK_LABELS,
  MY_ROUTINE_TELEFARMED_SHORTCUTS,
  type MyRoutineDayPhase,
} from '../../utils/myRoutineTodayHelpers'
import { computeMinimalRoutineProgress } from '../../utils/myRoutinePlanEngine'
import { AppointmentActionButton } from '../appointments/AppointmentActionButton'
import { MyRoutineDayTimeline } from './MyRoutineDayTimeline'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'

const PALETTE = ACTION_ICON_PALETTES.myRoutine
const ACCENT = '#d946ef'
const ACCENT_LIGHT = '#f0abfc'

export type MyRoutineTodayTabProps = {
  bottomPadding: number
  isLoading: boolean
  dayPlan: MyRoutineDayPlan | null
  dayPhase: MyRoutineDayPhase
  hasDayClosure: boolean
  onOpenDayMap: () => void
  onOpenMinimalExplain: () => void
  onOpenTaskDetail: (task: MyRoutineTask) => void
  onMarkDone: (taskId: string) => void
  onSnoozeTask: (task: MyRoutineTask) => void
  onSkipTask: (task: MyRoutineTask) => void
  onOpenDayClosure: () => void
  onNavigateModule: (route: AppScreen) => void
}

function TaskStatusIcon({ task }: { task: MyRoutineTask }) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  if (task.status === 'done') return <Ionicons name="checkmark-circle" size={18} color={ACCENT_LIGHT} />
  if (task.status === 'skipped') return <Ionicons name="heart-outline" size={18} color={colors.textSubtle} />
  if (task.status === 'snoozed') return <Ionicons name="time-outline" size={18} color="#c4b5fd" />
  return <View style={styles.pendingDot} />
}

export function MyRoutineTodayTab({
  bottomPadding,
  isLoading,
  dayPlan,
  dayPhase,
  hasDayClosure,
  onOpenDayMap,
  onOpenMinimalExplain,
  onOpenTaskDetail,
  onMarkDone,
  onSnoozeTask,
  onSkipTask,
  onOpenDayClosure,
  onNavigateModule,
}: MyRoutineTodayTabProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  if (isLoading || !dayPlan) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={ACCENT_LIGHT} />
      </View>
    )
  }

  const progress = computeMinimalRoutineProgress(dayPlan)
  const heroPhrase = buildDayHeroPhrase(dayPlan, dayPhase)
  const nextTask = dayPlan.tasks.find((task) => task.status === 'pending' || task.status === 'snoozed') ?? null
  const grouped = groupTasksByBlock(dayPlan.tasks)
  const minimalTasks = dayPlan.tasks.filter((task) => dayPlan.minimalRoutineTaskIds.includes(task.id))

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 72 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* A — Hero */}
      <LinearGradient
        colors={['rgba(240, 171, 252, 0.2)', 'rgba(14, 14, 20, 0.98)']}
        style={styles.heroCard}
      >
        <Text style={styles.heroEyebrow}>Seu dia em uma frase</Text>
        <Text style={styles.heroPhrase}>{heroPhrase}</Text>
        <MyRoutineDayTimeline phase={dayPhase} />
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            onOpenDayMap()
          }}
          style={({ pressed }) => [styles.mapBtn, pressed && styles.mapBtnPressed]}
        >
          <Ionicons name="map-outline" size={16} color={ACCENT_LIGHT} />
          <Text style={styles.mapBtnText}>Ver mapa do dia</Text>
        </Pressable>
      </LinearGradient>

      {/* B — Consistency bar */}
      <Pressable
        onPress={onOpenMinimalExplain}
        style={({ pressed }) => [styles.consistencyCard, pressed && styles.cardPressed]}
      >
        <View style={styles.consistencyHeader}>
          <Text style={styles.sectionTitle}>Rotina mínima</Text>
          <Text style={styles.consistencyMeta}>
            {progress.done}/{progress.total} essenciais
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(progress.ratio * 100)}%` as `${number}%` },
            ]}
          />
        </View>
        <Text style={styles.consistencyHint}>Toque para entender a rotina mínima</Text>
      </Pressable>

      {/* C — Next task card */}
      {nextTask ? (
        <View style={styles.sectionWrap}>
          <LinearGradient
            colors={['rgba(217, 70, 239, 0.22)', 'rgba(14, 14, 20, 0.98)']}
            style={styles.nextTaskCard}
          >
            <View style={styles.nextTaskBadgeRow}>
              <View style={styles.nextTaskBadge}>
                <MaterialCommunityIcons name="lightning-bolt" size={12} color={ACCENT_LIGHT} />
                <Text style={styles.nextTaskBadgeText}>Próxima tarefa</Text>
              </View>
              <Pressable
                onPress={() => onOpenTaskDetail(nextTask)}
                hitSlop={8}
                style={({ pressed }) => [styles.detailsLink, pressed && styles.cardPressed]}
              >
                <Text style={styles.detailsLinkText}>Detalhes</Text>
              </Pressable>
            </View>
            <Text style={styles.nextTaskTitle}>{nextTask.title}</Text>
            <Text style={styles.nextTaskMeta}>{formatTaskScheduleLabel(nextTask)}</Text>
            <View style={styles.actionsRow}>
              <AppointmentActionButton
                label="Feito"
                icon="check"
                palette={PALETTE}
                onPress={() => onMarkDone(nextTask.id)}
              />
              <AppointmentActionButton
                label="Adiar"
                icon="clock-outline"
                palette={ACTION_ICON_PALETTES.myGoals}
                onPress={() => onSnoozeTask(nextTask)}
              />
              <AppointmentActionButton
                label="Pular"
                icon="close"
                palette={ACTION_ICON_PALETTES.myMetrics}
                onPress={() => onSkipTask(nextTask)}
              />
            </View>
          </LinearGradient>
        </View>
      ) : null}

      {/* D — Timeline blocks */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeading}>Timeline do dia</Text>
        {MY_ROUTINE_BLOCK_ORDER.map((block) => {
          const tasks = grouped[block]
          if (tasks.length === 0) return null

          return (
            <View key={block} style={styles.blockSection}>
              <Text style={styles.blockTitle}>{MY_ROUTINE_BLOCK_LABELS[block]}</Text>
              {tasks.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => onOpenTaskDetail(task)}
                  style={({ pressed }) => [styles.timelineRow, pressed && styles.cardPressed]}
                >
                  <TaskStatusIcon task={task} />
                  <View style={styles.timelineCopy}>
                    <Text
                      style={[
                        styles.timelineTitle,
                        (task.status === 'done' || task.status === 'skipped') && styles.timelineTitleMuted,
                      ]}
                    >
                      {task.title}
                    </Text>
                    <Text style={styles.timelineMeta}>{formatTaskScheduleLabel(task)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
                </Pressable>
              ))}
            </View>
          )
        })}
      </View>

      {/* E — Compact minimal routine */}
      {minimalTasks.length > 0 ? (
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Essenciais de hoje</Text>
          <View style={styles.minimalCard}>
            {minimalTasks.map((task) => (
              <Pressable
                key={task.id}
                onPress={() => onOpenTaskDetail(task)}
                style={styles.minimalRow}
              >
                <TaskStatusIcon task={task} />
                <Text
                  style={[
                    styles.minimalTitle,
                    task.status === 'done' && styles.timelineTitleMuted,
                  ]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {/* F — Telefarmed shortcuts */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeading}>Atalhos Telefarmed</Text>
        <View style={styles.shortcutsGrid}>
          {MY_ROUTINE_TELEFARMED_SHORTCUTS.map((shortcut) => (
            <Pressable
              key={shortcut.id}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                onNavigateModule(shortcut.route)
              }}
              style={({ pressed }) => [styles.shortcutCard, pressed && styles.cardPressed]}
            >
              <Ionicons name={shortcut.icon} size={20} color={ACCENT_LIGHT} />
              <Text style={styles.shortcutLabel}>{shortcut.label}</Text>
              <Text style={styles.shortcutSub}>{shortcut.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* G — Day closure CTA */}
      {!hasDayClosure ? (
        <Pressable
          onPress={onOpenDayClosure}
          style={({ pressed }) => [styles.closureCta, pressed && styles.cardPressed]}
        >
          <Ionicons name="moon-outline" size={18} color={ACCENT_LIGHT} />
          <View style={styles.closureCopy}>
            <Text style={styles.closureTitle}>Como foi seu dia?</Text>
            <Text style={styles.closureSub}>Encerramento rápido · 30 segundos</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
        </Pressable>
      ) : (
        <View style={styles.closureDone}>
          <Ionicons name="checkmark-circle" size={18} color={ACCENT_LIGHT} />
          <Text style={styles.closureDoneText}>Dia encerrado — até amanhã!</Text>
        </View>
      )}
    </ScrollView>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
  },
  content: {
    paddingTop: 8,
    gap: 12,
  },
  heroCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.22)',
  },
  heroEyebrow: {
    color: ACCENT_LIGHT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroPhrase: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  mapBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(217, 70, 239, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.25)',
    marginTop: 4,
  },
  mapBtnPressed: { opacity: 0.88 },
  mapBtnText: {
    color: ACCENT_LIGHT,
    fontSize: 12,
    fontWeight: '700',
  },
  consistencyCard: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  consistencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  consistencyMeta: {
    color: ACCENT_LIGHT,
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  consistencyHint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionWrap: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sectionHeading: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  nextTaskCard: {
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.28)',
  },
  nextTaskBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextTaskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(217, 70, 239, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.25)',
  },
  nextTaskBadgeText: {
    color: ACCENT_LIGHT,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailsLink: { paddingVertical: 4, paddingHorizontal: 6 },
  detailsLinkText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  nextTaskTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  nextTaskMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  blockSection: { gap: 6 },
  blockTitle: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  timelineCopy: { flex: 1, gap: 2 },
  timelineTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  timelineTitleMuted: {
    color: colors.textSubtle,
    textDecorationLine: 'line-through',
  },
  timelineMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  pendingDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  minimalCard: {
    borderRadius: 14,
    padding: 10,
    gap: 4,
    backgroundColor: 'rgba(217, 70, 239, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.16)',
  },
  minimalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  minimalTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shortcutCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    padding: 12,
    borderRadius: 14,
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  shortcutLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  shortcutSub: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },
  closureCta: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.22)',
  },
  closureCopy: { flex: 1, gap: 2 },
  closureTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  closureSub: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  closureDone: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  closureDoneText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  cardPressed: { opacity: 0.88 },
}
}


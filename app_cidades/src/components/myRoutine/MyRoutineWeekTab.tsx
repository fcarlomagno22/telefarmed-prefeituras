import { Ionicons } from '@expo/vector-icons'
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
import type { MyRoutineTask, MyRoutineWeekendMode } from '../../types/myRoutine'
import { MY_ROUTINE_WEEKEND_MODE_OPTIONS } from '../../types/myRoutine'
import type { MyRoutineWeekDayPreview, MyRoutineWeekSummary } from '../../utils/myRoutineWeekStats'
import { MY_ROUTINE_TEMPLATES } from '../../utils/myRoutineTemplates'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'

const ACCENT = '#d946ef'
const ACCENT_LIGHT = '#f0abfc'

export type MyRoutineWeekTabProps = {
  bottomPadding: number
  isLoading: boolean
  weekLabel: string
  summary: MyRoutineWeekSummary
  dayPreviews: MyRoutineWeekDayPreview[]
  weekendMode: MyRoutineWeekendMode
  templateId: string | null
  recurringTemplates: MyRoutineTask[]
  reviewApplied: boolean
  onPrevWeek: () => void
  onNextWeek: () => void
  onOpenWeekPicker: () => void
  onOpenWeeklyReview: () => void
  onOpenDayPlan: (preview: MyRoutineWeekDayPreview) => void
  onOpenRecurringHabit: (task?: MyRoutineTask) => void
  onOpenWeekendMode: () => void
  onOpenTemplatePicker: () => void
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent: string
}) {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.summaryCard}>
      <Text style={[styles.summaryValue, { color: accent }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  )
}

export function MyRoutineWeekTab({
  bottomPadding,
  isLoading,
  weekLabel,
  summary,
  dayPreviews,
  weekendMode,
  templateId,
  recurringTemplates,
  reviewApplied,
  onPrevWeek,
  onNextWeek,
  onOpenWeekPicker,
  onOpenWeeklyReview,
  onOpenDayPlan,
  onOpenRecurringHabit,
  onOpenWeekendMode,
  onOpenTemplatePicker,
}: MyRoutineWeekTabProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const weekSummary = summary ?? {
    minimalOkDays: 0,
    tasksDone: 0,
    lightDays: 0,
    totalDays: 0,
  }
  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={ACCENT_LIGHT} />
      </View>
    )
  }

  const weekendLabel =
    MY_ROUTINE_WEEKEND_MODE_OPTIONS.find((item) => item.id === weekendMode)?.label ?? 'Equilibrado'
  const templateLabel = templateId ? MY_ROUTINE_TEMPLATES[templateId as keyof typeof MY_ROUTINE_TEMPLATES]?.label : '—'

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      {/* A — Week selector */}
      <Pressable
        onPress={onOpenWeekPicker}
        style={({ pressed }) => [styles.weekSelector, pressed && styles.cardPressed]}
      >
        <Pressable
          onPress={(event) => {
            event.stopPropagation?.()
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            onPrevWeek()
          }}
          hitSlop={8}
          style={styles.weekNavBtn}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.weekSelectorCopy}>
          <Text style={styles.weekSelectorEyebrow}>Semana</Text>
          <Text style={styles.weekSelectorLabel}>{weekLabel}</Text>
        </View>
        <Pressable
          onPress={(event) => {
            event.stopPropagation?.()
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            onNextWeek()
          }}
          hitSlop={8}
          style={styles.weekNavBtn}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </Pressable>

      {/* B — Summary cards */}
      <View style={styles.summaryRow}>
        <SummaryCard label="Mínima ok" value={weekSummary.minimalOkDays} accent={ACCENT_LIGHT} />
        <SummaryCard label="Tarefas feitas" value={weekSummary.tasksDone} accent="#c4b5fd" />
        <SummaryCard label="Dias leves" value={weekSummary.lightDays} accent="#a78bfa" />
      </View>

      {/* C — Weekly review */}
      <Pressable
        onPress={onOpenWeeklyReview}
        style={({ pressed }) => [styles.reviewCard, pressed && styles.cardPressed]}
      >
        <LinearGradient
          colors={['rgba(217, 70, 239, 0.18)', 'rgba(14, 14, 20, 0.98)']}
          style={styles.reviewCardInner}
        >
          <View style={styles.reviewCopy}>
            <Text style={styles.reviewTitle}>Revisão de 5 min</Text>
            <Text style={styles.reviewSub}>
              {reviewApplied ? 'Revisão aplicada nesta semana' : 'Ajuste o plano com base na sua semana'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
        </LinearGradient>
      </Pressable>

      {/* D — 7 day cards */}
      <Text style={styles.sectionHeading}>Dias da semana</Text>
      <View style={styles.daysCol}>
        {dayPreviews.map((day) => (
          <Pressable
            key={day.dateIso}
            onPress={() => onOpenDayPlan(day)}
            style={({ pressed }) => [
              styles.dayCard,
              day.isToday && styles.dayCardToday,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.dayHeader}>
              <View style={styles.dayTitleRow}>
                <Text style={styles.dayWeekday}>{day.weekdayShort}</Text>
                {day.isWeekend ? (
                  <View style={styles.weekendBadge}>
                    <Text style={styles.weekendBadgeText}>FDS</Text>
                  </View>
                ) : null}
                {day.isToday ? (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>Hoje</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.dayMeta}>
                {day.doneCount} feitas · {day.essentialCount} essenciais
              </Text>
            </View>
            {day.previewTitles.length > 0 ? (
              <Text style={styles.dayPreview} numberOfLines={2}>
                {day.previewTitles.join(' · ')}
              </Text>
            ) : (
              <Text style={styles.dayPreviewEmpty}>Sem tarefas planejadas</Text>
            )}
            {day.minimalComplete ? (
              <Text style={styles.dayOk}>Rotina mínima ok</Text>
            ) : day.dayPlan.dayMode === 'light' ? (
              <Text style={styles.dayLight}>Dia leve</Text>
            ) : null}
          </Pressable>
        ))}
      </View>

      {/* E — Recurring habits */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Hábitos recorrentes</Text>
          <Pressable onPress={() => onOpenRecurringHabit()} style={styles.linkBtn}>
            <Ionicons name="add" size={16} color={ACCENT_LIGHT} />
            <Text style={styles.linkBtnText}>Novo hábito</Text>
          </Pressable>
        </View>
        {recurringTemplates.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum hábito recorrente ainda.</Text>
        ) : (
          recurringTemplates.map((task) => (
            <Pressable
              key={task.id}
              onPress={() => onOpenRecurringHabit(task)}
              style={({ pressed }) => [styles.recurringRow, pressed && styles.cardPressed]}
            >
              <Text style={styles.recurringTitle}>{task.title}</Text>
              <Text style={styles.recurringMeta}>{task.priority} · recorrente</Text>
            </Pressable>
          ))
        )}
      </View>

      {/* F — Weekend mode + template */}
      <Pressable
        onPress={onOpenWeekendMode}
        style={({ pressed }) => [styles.modeCard, pressed && styles.cardPressed]}
      >
        <Text style={styles.modeEyebrow}>Fim de semana</Text>
        <Text style={styles.modeTitle}>{weekendLabel}</Text>
        <Text style={styles.modeSub}>Toque para alterar descanso / equilíbrio / manter</Text>
      </Pressable>

      <Pressable
        onPress={onOpenTemplatePicker}
        style={({ pressed }) => [styles.modeCard, pressed && styles.cardPressed]}
      >
        <Text style={styles.modeEyebrow}>Template ativo</Text>
        <Text style={styles.modeTitle}>{templateLabel}</Text>
        <Text style={styles.modeSub}>Trocar template com prévia de merge</Text>
      </Pressable>
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
  weekSelector: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  weekNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  weekSelectorCopy: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  weekSelectorEyebrow: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  weekSelectorLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  reviewCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  reviewCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.22)',
    borderRadius: 16,
  },
  reviewCopy: { flex: 1, gap: 2 },
  reviewTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  reviewSub: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeading: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
  },
  daysCol: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  dayCardToday: {
    borderColor: 'rgba(240, 171, 252, 0.35)',
    backgroundColor: 'rgba(217, 70, 239, 0.06)',
  },
  dayHeader: { gap: 2 },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayWeekday: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  weekendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(167, 139, 250, 0.16)',
  },
  weekendBadgeText: {
    color: '#c4b5fd',
    fontSize: 9,
    fontWeight: '800',
  },
  todayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(217, 70, 239, 0.16)',
  },
  todayBadgeText: {
    color: ACCENT_LIGHT,
    fontSize: 9,
    fontWeight: '800',
  },
  dayMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  dayPreview: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  dayPreviewEmpty: {
    color: colors.textSubtle,
    fontSize: 12,
    fontStyle: 'italic',
  },
  dayOk: {
    color: ACCENT_LIGHT,
    fontSize: 11,
    fontWeight: '800',
  },
  dayLight: {
    color: '#c4b5fd',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionBlock: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  linkBtnText: {
    color: ACCENT_LIGHT,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  recurringRow: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 2,
  },
  recurringTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  recurringMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modeCard: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 70, 239, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.16)',
    gap: 4,
  },
  modeEyebrow: {
    color: ACCENT_LIGHT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  modeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  modeSub: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  cardPressed: { opacity: 0.88 },
}
}


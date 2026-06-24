import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useMemo, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { buildWeekOverview } from '../../data/mentalHealthTodayState'
import type { MentalHealthCheckInEntry } from '../../types/mentalHealth'
import type { UserClinicalState } from '../../types/mentalHealthEngine'
import { colors } from '../../theme/colors'
import {
  formatMentalHealthCheckInTime,
  formatMentalHealthEmotions,
  formatMentalHealthMoodDisplay,
} from '../../utils/mentalHealthCheckIn'
import {
  computeCheckInStreak,
  countCompletedActivities7d,
  formatAdherencePercent,
  getRecentActivitySummaries,
} from '../../utils/mentalHealthMyCare'
import { toLocalDateIso } from '../../utils/runWalkWeeklyChart'
import { MentalHealthMoodWeekChart } from './MentalHealthMoodWeekChart'

type MentalHealthMyCareTabProps = {
  bottomPadding: number
  clinicalState: UserClinicalState | null
  checkInEntries: MentalHealthCheckInEntry[]
  journalHasEntryToday: boolean
  journalNote?: string | null
  onViewAllCheckIns: () => void
  onSelectCheckIn: (entry: MentalHealthCheckInEntry) => void
  onOpenJournal: () => void
}

function formatEntryDate(iso: string) {
  const today = toLocalDateIso(new Date())
  const entryDate = toLocalDateIso(new Date(iso))
  if (entryDate === today) return 'Hoje'
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

export function MentalHealthMyCareTab({
  bottomPadding,
  clinicalState,
  checkInEntries,
  journalHasEntryToday,
  journalNote,
  onViewAllCheckIns,
  onSelectCheckIn,
  onOpenJournal,
}: MentalHealthMyCareTabProps) {
  const weekOverview = useMemo(() => buildWeekOverview(checkInEntries), [checkInEntries])
  const checkInStreak = useMemo(() => computeCheckInStreak(checkInEntries), [checkInEntries])
  const recentActivities = useMemo(
    () => getRecentActivitySummaries(clinicalState?.activity_history ?? []),
    [clinicalState?.activity_history],
  )
  const completedActivities7d = useMemo(
    () => countCompletedActivities7d(clinicalState?.activity_history ?? []),
    [clinicalState?.activity_history],
  )
  const adherence = clinicalState?.plan_state.adherence_7d ?? 0
  const previewEntries = checkInEntries.slice(0, 5)

  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Histórico</Text>
        <Text style={styles.heroTitle}>Seu ritmo ao longo do tempo</Text>
      </View>

      <Text style={styles.leadSummary}>{weekOverview.summary}</Text>

      <View style={styles.moodHighlightCard}>
        <Text style={styles.moodHighlightTitle}>Como você tem estado</Text>
        <Text style={styles.moodHighlightSubtitle}>Últimos 7 dias</Text>
        <MentalHealthMoodWeekChart days={weekOverview.days} />
        {weekOverview.days.every((day) => day.level === 'empty') ? (
          <Text style={styles.emptyText}>Ainda não há registros nos últimos 7 dias.</Text>
        ) : null}
        {checkInStreak > 0 ? (
          <Text style={styles.streakText}>
            {checkInStreak} {checkInStreak === 1 ? 'dia seguido' : 'dias seguidos'} com registro
          </Text>
        ) : null}
      </View>

      <Section title="Registros" subtitle="Check-ins emocionais">
        {previewEntries.length === 0 ? (
          <Text style={styles.emptyText}>Você ainda não tem registros salvos.</Text>
        ) : (
          previewEntries.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                onSelectCheckIn(entry)
              }}
              style={({ pressed }) => [styles.checkInRow, pressed && styles.pressed]}
            >
              <View style={styles.checkInHeader}>
                <Text style={styles.checkInDate}>{formatEntryDate(entry.recordedAt)}</Text>
                <Text style={styles.checkInTime}>
                  {formatMentalHealthCheckInTime(entry.recordedAt)}
                </Text>
              </View>
              <Text style={styles.checkInMood}>{formatMentalHealthMoodDisplay(entry.mood)}</Text>
              <Text style={styles.checkInMeta}>{formatMentalHealthEmotions(entry.emotions)}</Text>
            </Pressable>
          ))
        )}
        {checkInEntries.length > 0 ? (
          <ActionChip label="Ver todos os registros" onPress={onViewAllCheckIns} subtle />
        ) : null}
      </Section>

      <Section title="Seus cuidados" subtitle="Plano e aderência">
        <View style={styles.statsRow}>
          <StatCard
            label="Aderência 7d"
            value={formatAdherencePercent(adherence)}
            hint={
              completedActivities7d > 0
                ? `${completedActivities7d} feita${completedActivities7d === 1 ? '' : 's'} na semana`
                : 'Sem atividades na semana'
            }
          />
          <StatCard
            label="Registros"
            value={String(checkInEntries.length)}
            hint={checkInStreak > 0 ? `${checkInStreak}d seguidos` : 'Sem sequência ativa'}
          />
        </View>
        {recentActivities.length > 0 ? (
          <View style={styles.activityList}>
            {recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityRow}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityMeta}>
                  {activity.feedbackLabel ?? 'Concluída'}
                  {activity.planDate ? ` · ${activity.planDate}` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Atividades concluídas aparecerão aqui.</Text>
        )}
      </Section>

      <Section title="Registro breve" subtitle="Opcional — reflexão do dia">
        {journalHasEntryToday ? (
          <View style={styles.journalSaved}>
            <Ionicons name="checkmark-circle" size={18} color="#86efac" />
            <Text style={styles.journalSavedText}>
              {journalNote ? journalNote : 'Registro salvo hoje.'}
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>Ainda sem registro breve hoje.</Text>
        )}
        <ActionChip
          label={journalHasEntryToday ? 'Editar registro de hoje' : 'Escrever registro breve'}
          onPress={onOpenJournal}
          subtle
        />
      </Section>
    </ScrollView>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  )
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  )
}

function ActionChip({
  label,
  onPress,
  subtle = false,
}: {
  label: string
  onPress: () => void
  subtle?: boolean
}) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      style={({ pressed }) => [
        styles.actionChip,
        subtle && styles.actionChipSubtle,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionChipText, subtle && styles.actionChipTextSubtle]}>{label}</Text>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={subtle ? colors.textMuted : '#1a1208'}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  content: { paddingTop: 8, paddingHorizontal: 20, gap: 22 },
  hero: { gap: 8 },
  eyebrow: {
    color: 'rgba(196, 181, 253, 0.85)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  leadSummary: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: -6,
  },
  moodHighlightCard: {
    gap: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.22)',
  },
  moodHighlightTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  moodHighlightSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: -6,
  },
  section: { gap: 10 },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
  sectionBody: { gap: 10, paddingTop: 2 },
  streakText: { color: '#a5f3fc', fontSize: 13, fontWeight: '600' },
  checkInRow: {
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  checkInHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  checkInDate: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  checkInTime: { color: colors.textSubtle, fontSize: 11 },
  checkInMood: { color: colors.text, fontSize: 15, fontWeight: '700' },
  checkInMeta: { color: colors.textMuted, fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  statCard: {
    flex: 1,
    maxWidth: '48%',
    gap: 4,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.2)',
  },
  statLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  statHint: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  activityList: { gap: 8 },
  activityRow: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 2,
  },
  activityTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  activityMeta: { color: colors.textMuted, fontSize: 12 },
  journalSaved: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  journalSavedText: { flex: 1, color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  emptyText: { color: colors.textSubtle, fontSize: 14, lineHeight: 20 },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#c4b5fd',
  },
  actionChipSubtle: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionChipText: { color: '#1a1208', fontSize: 14, fontWeight: '700' },
  actionChipTextSubtle: { color: colors.text },
  pressed: { opacity: 0.88 },
})

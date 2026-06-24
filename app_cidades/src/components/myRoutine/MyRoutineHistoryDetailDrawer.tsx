import { StyleSheet, Text, View } from 'react-native'
import type { MyRoutineWeeklyHistoryPoint } from '../../utils/myRoutineHistoryStats'
import { summarizeHistoryPoint } from '../../utils/myRoutineHistoryStats'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

type MyRoutineHistoryDetailDrawerProps = {
  visible: boolean
  point: MyRoutineWeeklyHistoryPoint | null
  onClose: () => void
}

export function MyRoutineHistoryDetailDrawer({
  visible,
  point,
  onClose,
}: MyRoutineHistoryDetailDrawerProps) {
  const styles = useThemedStyles(createStyles)
  if (!point) return null

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={point.weekLabel}
      subtitle="Detalhes da semana"
      onClose={onClose}
    >
      <View style={styles.content}>
        <View style={styles.summaryCard}>
          <SummaryItem label="Dias registrados" value={String(point.trackedDays)} />
          <SummaryItem label="Mínima ok" value={String(point.minimalOkDays)} />
          <SummaryItem label="Aderência" value={`${point.adherencePercent}%`} />
          <SummaryItem label="Dias leves" value={String(point.lightDays)} last />
        </View>

        <Text style={styles.summaryLine}>{summarizeHistoryPoint(point)}</Text>

        <Text style={styles.sectionLabel}>Dias</Text>
        {point.entries.length === 0 ? (
          <Text style={styles.empty}>Nenhum dia registrado nesta semana.</Text>
        ) : (
          point.entries.map((entry) => (
            <View key={entry.dateIso} style={styles.dayRow}>
              <View style={styles.dayCopy}>
                <Text style={styles.dayDate}>{formatDayLabel(entry.dateIso)}</Text>
                <Text style={styles.dayMeta}>
                  Mínima {entry.minimalDone}/{entry.minimalTotal}
                  {entry.dayMode === 'light' ? ' · dia leve' : ''}
                </Text>
              </View>
              <View
                style={[
                  styles.dayBadge,
                  entry.minimalTotal > 0 && entry.minimalDone >= entry.minimalTotal
                    ? styles.dayBadgeOk
                    : styles.dayBadgePending,
                ]}
              >
                <Text style={styles.dayBadgeText}>
                  {entry.minimalTotal > 0 && entry.minimalDone >= entry.minimalTotal ? 'Ok' : '—'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </RunWalkSheetDrawer>
  )
}

function SummaryItem({
  label,
  value,
  last = false,
}: {
  label: string
  value: string
  last?: boolean
}) {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={[styles.summaryItem, !last && styles.summaryItemBorder]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  )
}

function formatDayLabel(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00`)
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 12 },
  summaryCard: {
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  summaryItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValue: {
    color: '#f0abfc',
    fontSize: 14,
    fontWeight: '800',
  },
  summaryLine: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  sectionLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  dayCopy: { flex: 1, gap: 2 },
  dayDate: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  dayMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  dayBadge: {
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: 'center',
  },
  dayBadgeOk: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
  },
  dayBadgePending: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dayBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
}
}


import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { RunWalkHistoryPeriodSummary } from '../../../types/runWalkHistory'
import { formatDeltaLabel } from '../../../utils/runWalkHistoryStats'
import { formatCaloriesBurned } from '../../../utils/runWalkActivityStats'
import { RunWalkHistoryAnimatedBar } from './RunWalkHistoryAnimatedBar'
import { RunWalkHistoryAnimatedNumber } from './RunWalkHistoryAnimatedNumber'

type RunWalkHistorySummaryCardProps = {
  summary: RunWalkHistoryPeriodSummary
  targetActiveMinutes: number
  targetDistanceKm: number
  animate?: boolean
  preserveFinal?: boolean
}

function SummaryColumn({
  label,
  valueNode,
  deltaPct,
}: {
  label: string
  valueNode: ReactNode
  deltaPct: number | null
}) {
  const deltaColor =
    deltaPct == null ? colors.textSubtle : deltaPct >= 0 ? '#6ee7b7' : '#fca5a5'

  return (
    <View style={styles.column}>
      <View style={styles.columnValueWrap}>{valueNode}</View>
      <Text style={styles.columnLabel}>{label}</Text>
      <Text style={[styles.columnDelta, { color: deltaColor }]} numberOfLines={1}>
        {formatDeltaLabel(deltaPct)}
      </Text>
    </View>
  )
}

export function RunWalkHistorySummaryCard({
  summary,
  targetActiveMinutes,
  targetDistanceKm,
  animate = true,
  preserveFinal = true,
}: RunWalkHistorySummaryCardProps) {
  const minutesProgress = targetActiveMinutes > 0 ? summary.totalActiveMinutes / targetActiveMinutes : 0
  const distanceProgress = targetDistanceKm > 0 ? summary.totalDistanceKm / targetDistanceKm : 0
  const minutesPct = Math.round(Math.min(minutesProgress, 1) * 100)
  const distancePct = Math.round(Math.min(distanceProgress, 1) * 100)
  const distanceDeltaColor =
    summary.distanceDeltaPct == null
      ? colors.textSubtle
      : summary.distanceDeltaPct >= 0
        ? '#6ee7b7'
        : '#fca5a5'

  return (
    <LinearGradient
      colors={['rgba(16, 185, 129, 0.18)', 'rgba(14, 14, 20, 0.98)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Resumo do período</Text>
        <View style={styles.headerBadge}>
          <Ionicons name="pulse-outline" size={13} color="#6ee7b7" />
          <RunWalkHistoryAnimatedNumber
            value={summary.totalWorkouts}
            animate={animate}
            preserveFinal={preserveFinal}
            formatter={(value) => `${Math.round(value)} treinos`}
            style={styles.headerBadgeText}
          />
        </View>
      </View>

      <View style={styles.hero}>
        <RunWalkHistoryAnimatedNumber
          value={summary.totalDistanceKm}
          animate={animate}
          preserveFinal={preserveFinal}
          formatter={(value) => value.toFixed(1).replace('.', ',')}
          style={styles.heroValue}
        />
        <Text style={styles.heroUnit}>km percorridos</Text>
        <Text style={[styles.heroDelta, { color: distanceDeltaColor }]}>
          {formatDeltaLabel(summary.distanceDeltaPct)}
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <SummaryColumn
          label="Tempo"
          deltaPct={summary.minutesDeltaPct}
          valueNode={
            <View style={styles.inlineValue}>
              <RunWalkHistoryAnimatedNumber
                value={summary.totalActiveMinutes}
                animate={animate}
            preserveFinal={preserveFinal}
                formatter={(value) => String(Math.round(value))}
                style={styles.columnValue}
              />
              <Text style={styles.columnValueSuffix}> min</Text>
            </View>
          }
        />
        <View style={styles.divider} />
        <SummaryColumn
          label="Treinos"
          deltaPct={summary.workoutsDeltaPct}
          valueNode={
            <RunWalkHistoryAnimatedNumber
              value={summary.totalWorkouts}
              animate={animate}
            preserveFinal={preserveFinal}
              formatter={(value) => String(Math.round(value))}
              style={styles.columnValue}
            />
          }
        />
        <View style={styles.divider} />
        <SummaryColumn
          label="Calorias"
          deltaPct={summary.caloriesDeltaPct}
          valueNode={
            <RunWalkHistoryAnimatedNumber
              value={summary.totalCalories}
              animate={animate}
            preserveFinal={preserveFinal}
              formatter={(value) => formatCaloriesBurned(Math.round(value))}
              style={styles.columnValue}
            />
          }
        />
      </View>

      <View style={styles.goalsSection}>
        <View style={styles.goalRow}>
          <View style={styles.goalLabelRow}>
            <Text style={styles.goalLabel}>Meta de tempo</Text>
            <RunWalkHistoryAnimatedNumber
              value={minutesPct}
              animate={animate}
            preserveFinal={preserveFinal}
              formatter={(value) => `${Math.round(value)}%`}
              style={styles.goalPct}
            />
          </View>
          <RunWalkHistoryAnimatedBar
            progress={minutesProgress}
            animate={animate}
            preserveFinal={preserveFinal}
            color="#10b981"
          />
        </View>

        <View style={styles.goalRow}>
          <View style={styles.goalLabelRow}>
            <Text style={styles.goalLabel}>Meta de distância</Text>
            <RunWalkHistoryAnimatedNumber
              value={distancePct}
              animate={animate}
            preserveFinal={preserveFinal}
              formatter={(value) => `${Math.round(value)}%`}
              style={styles.goalPct}
            />
          </View>
          <RunWalkHistoryAnimatedBar
            progress={distanceProgress}
            animate={animate}
            preserveFinal={preserveFinal}
            color="#3b82f6"
          />
        </View>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.24)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  headerBadgeText: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  heroValue: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.2,
    lineHeight: 48,
  },
  heroUnit: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  heroDelta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  columnValueWrap: {
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  columnValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  columnValueSuffix: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  columnLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  columnDelta: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  goalsSection: {
    gap: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  goalRow: {
    gap: 6,
  },
  goalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  goalPct: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
})

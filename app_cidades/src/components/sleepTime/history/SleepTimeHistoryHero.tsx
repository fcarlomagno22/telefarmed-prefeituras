import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { SleepWeekSummary } from '../../../types/sleepHistory'
import { formatSleepDuration } from '../../../utils/sleepLogFormat'
import { formatSleepDeltaLabel } from '../../../utils/sleepHistoryStats'
import { RunWalkHistoryAnimatedNumber } from '../../runWalk/history/RunWalkHistoryAnimatedNumber'

type SleepTimeHistoryHeroProps = {
  summary: SleepWeekSummary
  animate?: boolean
}

function DeltaText({ deltaPct }: { deltaPct: number | null }) {
  const deltaColor =
    deltaPct == null ? colors.textSubtle : deltaPct >= 0 ? '#a5b4fc' : '#fca5a5'

  return <Text style={[styles.metricDelta, { color: deltaColor }]}>{formatSleepDeltaLabel(deltaPct)}</Text>
}

export function SleepTimeHistoryHero({ summary, animate = true }: SleepTimeHistoryHeroProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.weekLabel}>{summary.weekLabel}</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Média de sono</Text>
            <RunWalkHistoryAnimatedNumber
              value={summary.avgDurationMinutes}
              animate={animate}
              preserveFinal={false}
              formatter={(value) => formatSleepDuration(Math.round(value))}
              style={styles.bigNumberLeft}
            />
            <DeltaText deltaPct={summary.durationDeltaPct} />
          </View>

          <View style={styles.metricColRight}>
            <Text style={[styles.metricLabel, styles.metricLabelRight]}>Qualidade média</Text>
            <RunWalkHistoryAnimatedNumber
              value={summary.avgQuality}
              animate={animate}
              preserveFinal={false}
              formatter={(value) => `${value.toFixed(1)}/5`}
              style={styles.bigNumberRight}
            />
            <DeltaText deltaPct={summary.qualityDeltaPct} />
          </View>
        </View>

        <Text style={styles.avgMeta}>
          {summary.nightsLogged} noite{summary.nightsLogged === 1 ? '' : 's'} registrada
          {summary.nightsLogged === 1 ? '' : 's'} · {summary.totalWakeCount} despertar
          {summary.totalWakeCount === 1 ? '' : 'es'} na semana
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 22,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.backgroundElevated,
  },
  weekLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCol: {
    flex: 1,
    gap: 4,
  },
  metricColRight: {
    flex: 1,
    gap: 4,
    alignItems: 'flex-end',
  },
  metricLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
  metricLabelRight: {
    textAlign: 'right',
  },
  bigNumberLeft: {
    color: '#4338ca',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  bigNumberRight: {
    color: '#6366f1',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'right',
  },
  metricDelta: {
    fontSize: 10,
    fontWeight: '600',
  },
  avgMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
})

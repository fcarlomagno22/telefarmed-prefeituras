import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import type { EatWellWeekSummary } from '../../../types/eatWell'
import { colors } from '../../../theme/colors'
import { formatCalories, formatLitersFromMl } from '../../../utils/eatWellNutritionStats'
import { formatDeltaLabel } from '../../../utils/eatWellWeekStats'
import { RunWalkHistoryAnimatedNumber } from '../../runWalk/history/RunWalkHistoryAnimatedNumber'

type EatWellWeekHeroProps = {
  summary: EatWellWeekSummary
  animate?: boolean
}

function DeltaText({ deltaPct }: { deltaPct: number | null }) {
  const deltaColor =
    deltaPct == null ? colors.textSubtle : deltaPct >= 0 ? '#6ee7b7' : '#fca5a5'

  return <Text style={[styles.metricDelta, { color: deltaColor }]}>{formatDeltaLabel(deltaPct)}</Text>
}

export function EatWellWeekHero({ summary, animate = true }: EatWellWeekHeroProps) {
  const activeDays = Math.max(summary.dayStats.filter((day) => !day.isFuture).length, 1)

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(132, 204, 22, 0.18)', 'rgba(14, 14, 20, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.weekLabel}>{summary.weekLabel}</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Calorias da semana</Text>
            <RunWalkHistoryAnimatedNumber
              value={summary.totalCalories}
              animate={animate}
              preserveFinal={animate}
              formatter={(value) => formatCalories(value)}
              style={styles.bigNumberLeft}
            />
            <DeltaText deltaPct={summary.caloriesDeltaPct} />
          </View>

          <View style={styles.metricColRight}>
            <Text style={[styles.metricLabel, styles.metricLabelRight]}>Água da semana</Text>
            <RunWalkHistoryAnimatedNumber
              value={summary.totalWaterMl}
              animate={animate}
              preserveFinal={animate}
              formatter={(value) => formatLitersFromMl(value)}
              style={styles.bigNumberRight}
            />
            <DeltaText deltaPct={summary.waterDeltaPct} />
          </View>
        </View>

        <Text style={styles.avgMeta}>
          Média diária · {formatCalories(summary.avgDailyCalories)} ·{' '}
          {formatLitersFromMl(summary.totalWaterMl / activeDays)} água
        </Text>
      </LinearGradient>
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
    borderColor: 'rgba(132, 204, 22, 0.22)',
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
    color: '#fde68a',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  bigNumberRight: {
    color: '#67e8f9',
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

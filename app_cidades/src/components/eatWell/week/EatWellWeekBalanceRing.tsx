import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import type { EatWellWeekSummary } from '../../../types/eatWell'
import { colors } from '../../../theme/colors'
import { getBalanceTier } from '../../../utils/eatWellNutritionStats'
import { RunWalkProgressRing } from '../../runWalk/RunWalkProgressRing'

type EatWellWeekBalanceRingProps = {
  summary: EatWellWeekSummary
  animate?: boolean
}

export function EatWellWeekBalanceRing({ summary, animate = true }: EatWellWeekBalanceRingProps) {
  const tier = getBalanceTier(summary.avgBalanceScore)
  const { excellent, good, fair, low } = summary.balanceDistribution
  const scoredDays = excellent + good + fair + low

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(77, 124, 15, 0.16)', 'rgba(14, 14, 20, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.contentRow}>
          <RunWalkProgressRing
            progress={summary.avgBalanceScore / 100}
            value={String(summary.avgBalanceScore)}
            countTo={summary.avgBalanceScore}
            formatCount={(value) => String(Math.round(value))}
            label="Equilíbrio médio"
            size={104}
            stroke={6}
            gradientId="eat-well-week-balance"
            gradientColors={tier.gradientColors}
            animate={animate}
            preserveFinal={animate}
          />

          <View style={styles.statsCol}>
            <Text style={styles.title}>Distribuição da semana</Text>
            <DistributionRow label="≥ 80 equilibrado" count={excellent} color="#10b981" total={scoredDays} />
            <DistributionRow label="60–79 no caminho" count={good} color="#84cc16" total={scoredDays} />
            <DistributionRow label="40–59 ajustando" count={fair} color="#f59e0b" total={scoredDays} />
            <DistributionRow label="< 40 atenção" count={low} color="#f87171" total={scoredDays} />
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}

function DistributionRow({
  label,
  count,
  color,
  total,
}: {
  label: string
  count: number
  color: string
  total: number
}) {
  const flex = total > 0 ? Math.max(count / total, count > 0 ? 0.08 : 0) : 0

  return (
    <View style={styles.distRow}>
      <View style={styles.distHeader}>
        <Text style={styles.distLabel}>{label}</Text>
        <Text style={styles.distCount}>{count}</Text>
      </View>
      <View style={styles.distTrack}>
        <View style={[styles.distFill, { flex, backgroundColor: color }]} />
        <View style={{ flex: Math.max(1 - flex, 0) }} />
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
    borderWidth: 1,
    borderColor: 'rgba(132, 204, 22, 0.18)',
  },
  contentRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  statsCol: {
    flex: 1,
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  distRow: {
    gap: 4,
  },
  distHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  distCount: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  distTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  distFill: {
    height: '100%',
    borderRadius: 999,
    minWidth: 4,
  },
})

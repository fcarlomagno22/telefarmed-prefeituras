import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { SleepWeekSummary } from '../../../types/sleepHistory'
import { getSleepQualityTier } from '../../../utils/sleepHistoryStats'
import { RunWalkProgressRing } from '../../runWalk/RunWalkProgressRing'

type SleepTimeHistoryQualityRingProps = {
  summary: SleepWeekSummary
  animate?: boolean
}

export function SleepTimeHistoryQualityRing({ summary, animate = true }: SleepTimeHistoryQualityRingProps) {
  const tier = getSleepQualityTier(summary.avgQuality)
  const { excellent, good, fair, poor } = summary.qualityDistribution
  const scoredDays = excellent + good + fair + poor

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(67, 56, 202, 0.16)', 'rgba(14, 14, 20, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.contentRow}>
          <RunWalkProgressRing
            progress={summary.avgQuality / 5}
            value={`${summary.avgQuality.toFixed(1)}`}
            countTo={animate ? summary.avgQuality : undefined}
            formatCount={(value) => value.toFixed(1)}
            label={tier.label}
            size={104}
            stroke={6}
            gradientId="sleep-history-quality"
            gradientColors={tier.gradientColors}
            animate={animate}
          />

          <View style={styles.statsCol}>
            <Text style={styles.title}>Qualidade das noites</Text>
            <DistributionRow label="Muito bem (5)" count={excellent} color="#6366f1" total={scoredDays} />
            <DistributionRow label="Bem (4)" count={good} color="#818cf8" total={scoredDays} />
            <DistributionRow label="Regular (3)" count={fair} color="#a5b4fc" total={scoredDays} />
            <DistributionRow label="Mal (1–2)" count={poor} color="#f87171" total={scoredDays} />
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
    borderColor: 'rgba(99, 102, 241, 0.18)',
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
    fontSize: 14,
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
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '800',
  },
  distTrack: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  distFill: {
    borderRadius: 999,
  },
})

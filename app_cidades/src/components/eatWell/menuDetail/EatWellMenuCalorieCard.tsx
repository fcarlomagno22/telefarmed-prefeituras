import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import { formatCalories } from '../../../utils/eatWellNutritionStats'
import { RunWalkHistoryAnimatedNumber } from '../../runWalk/history/RunWalkHistoryAnimatedNumber'

type EatWellMenuCalorieCardProps = {
  consumedCalories: number
  targetCalories: number
  animate?: boolean
}

export function EatWellMenuCalorieCard({
  consumedCalories,
  targetCalories,
  animate = true,
}: EatWellMenuCalorieCardProps) {
  const progressPct =
    targetCalories > 0 ? Math.min(100, Math.round((consumedCalories / targetCalories) * 100)) : 0

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Calorias do dia</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Consumidas</Text>
            <RunWalkHistoryAnimatedNumber
              value={consumedCalories}
              animate={animate}
              preserveFinal={false}
              duration={700}
              formatter={(value) => formatCalories(value)}
              style={styles.bigNumber}
            />
          </View>

          <View style={styles.metricColRight}>
            <Text style={[styles.metricLabel, styles.metricLabelRight]}>Meta do cardápio</Text>
            <Text style={styles.targetNumber}>{formatCalories(targetCalories)}</Text>
            <Text style={styles.progressMeta}>{progressPct}% do plano</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
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
  eyebrow: {
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
  bigNumber: {
    color: '#b45309',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  targetNumber: {
    color: '#4d7c0f',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'right',
  },
  progressMeta: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'right',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#65a30d',
  },
})

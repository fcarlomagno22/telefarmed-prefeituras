import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  formatActivityDistanceKmParts,
  formatElapsedActivityTimeParts,
  formatSpeedKmhParts,
  type ActivityMetricParts,
} from '../../../utils/runWalkActivityStats'
import { colors } from '../../../theme/colors'
import { ActivityMetricValue } from './ActivityMetricValue'

type RunWalkActivityMetricsCardProps = {
  elapsedSeconds: number
  distanceKm: number
  speedKmh: number | null
  isFinished: boolean
  isPaused?: boolean
  onFinishPress: () => void
}

type MetricColumnProps = {
  label: string
  value?: string
  metricParts?: ActivityMetricParts
}

function MetricColumn({ label, value, metricParts }: MetricColumnProps) {
  return (
    <View style={styles.metricColumn}>
      {metricParts ? (
        <ActivityMetricValue
          parts={metricParts}
          valueStyle={styles.metricValue}
          unitStyle={styles.metricUnit}
        />
      ) : (
        <Text style={styles.metricValue} numberOfLines={1}>
          {value}
        </Text>
      )}
      <Text style={styles.metricLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

export function RunWalkActivityMetricsCard({
  elapsedSeconds,
  distanceKm,
  speedKmh,
  isFinished,
  isPaused = false,
  onFinishPress,
}: RunWalkActivityMetricsCardProps) {
  function handleFinishPress() {
    if (isFinished) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onFinishPress()
  }

  return (
    <View style={styles.root}>
      {isPaused && !isFinished ? (
        <View style={styles.pausedBadge}>
          <Text style={styles.pausedBadgeText}>Treino pausado</Text>
        </View>
      ) : null}

      {isFinished ? (
        <View style={styles.finishedBadge}>
          <Text style={styles.finishedBadgeText}>Treino encerrado</Text>
        </View>
      ) : null}

      <View style={styles.metricsRow}>
        <MetricColumn label="Velocidade" metricParts={formatSpeedKmhParts(speedKmh)} />
        <View style={styles.divider} />
        <MetricColumn label="Tempo" metricParts={formatElapsedActivityTimeParts(elapsedSeconds)} />
        <View style={styles.divider} />
        <MetricColumn label="Distância" metricParts={formatActivityDistanceKmParts(distanceKm)} />
      </View>

      {!isFinished ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Terminar treino"
          onPress={handleFinishPress}
          style={({ pressed }) => [styles.finishButton, pressed && styles.finishButtonPressed]}
        >
          <Text style={styles.finishButtonText}>Terminar treino</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: 'rgba(10, 10, 12, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  finishedBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.28)',
  },
  finishedBadgeText: {
    color: '#86efac',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  pausedBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.28)',
  },
  pausedBadgeText: {
    color: '#fde68a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  metricValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    fontSize: 13,
    letterSpacing: 0,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  finishButton: {
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  finishButtonPressed: {
    opacity: 0.88,
    backgroundColor: colors.primaryDark,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
})

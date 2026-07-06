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
  speedLabel?: string
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
  speedLabel = 'Vel. média',
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
        <MetricColumn label={speedLabel} metricParts={formatSpeedKmhParts(speedKmh)} />
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
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  finishedBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.28)',
  },
  finishedBadgeText: {
    color: '#15803d',
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
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.28)',
  },
  pausedBadgeText: {
    color: '#d97706',
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
    backgroundColor: colors.surfaceBorder,
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

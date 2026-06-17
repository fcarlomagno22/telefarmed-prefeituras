import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import type { ComponentProps, ReactNode } from 'react'
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import type { RunWalkActivitySummary } from '../../../data/runWalkActivitySummaryStorage'
import { colors } from '../../../theme/colors'
import { formatActivityDrawerMeta } from '../../../utils/runWalkActivityLocation'
import {
  compareWithPreviousSameModality,
  computeKmSplits,
  computePaceSeries,
} from '../../../utils/runWalkHistoryStats'
import {
  formatActivityDistanceKmParts,
  formatCaloriesBurned,
  formatElapsedActivityTime,
  formatElapsedActivityTimeParts,
  formatPaceMinPerKm,
  formatPaceMinPerKmParts,
  formatSpeedKmhParts,
  type ActivityMetricParts,
} from '../../../utils/runWalkActivityStats'
import { ActivityMetricValue } from '../liveActivity/ActivityMetricValue'
import { RunWalkActivityTrailMap } from '../liveActivity/RunWalkActivityTrailMap'
import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'
import { RunWalkHistoryTrendChart } from './RunWalkHistoryTrendChart'

type RunWalkHistoryActivityDrawerProps = {
  visible: boolean
  activity: RunWalkActivitySummary | null
  allActivities: RunWalkActivitySummary[]
  profilePhotoUri?: string | null
  onClose: () => void
  onShare: () => void
}

type MetricTileProps = {
  icon: ComponentProps<typeof Ionicons>['name']
  label: string
  value?: string
  parts?: ActivityMetricParts
  accent?: string
}

export function RunWalkHistoryActivityDrawer({
  visible,
  activity,
  allActivities,
  profilePhotoUri,
  onClose,
  onShare,
}: RunWalkHistoryActivityDrawerProps) {
  const { width } = useWindowDimensions()
  const chartWidth = width - 40

  const comparison = useMemo(
    () => (activity ? compareWithPreviousSameModality(activity, allActivities) : null),
    [activity, allActivities],
  )
  const splits = useMemo(() => (activity ? computeKmSplits(activity) : []), [activity])
  const paceSeries = useMemo(() => {
    if (!activity) return []
    return computePaceSeries(activity).map((point, index) => ({
      id: `${activity.id}-pace-${index}`,
      label: `${point.distanceKm.toFixed(1)} km`,
      value: point.paceMinPerKm ?? 0,
      dateIso: '',
      activityName: formatPaceMinPerKm(point.paceMinPerKm),
    }))
  }, [activity])

  if (!activity) return null

  const distanceParts = formatActivityDistanceKmParts(activity.distanceKm)
  const timeParts = formatElapsedActivityTimeParts(activity.elapsedSeconds)
  const speedParts = formatSpeedKmhParts(activity.averageSpeedKmh)
  const paceParts = formatPaceMinPerKmParts(activity.paceMinPerKm)

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Detalhes do treino"
      subtitle={formatActivityDrawerMeta(
        activity.completedAt,
        activity.locationCity,
        activity.locationState,
      )}
      onClose={onClose}
      fullScreen
      scrollable
      footer={
        <View style={styles.footer}>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onShare()
            }}
            style={styles.secondaryButton}
          >
            <Ionicons name="share-social-outline" size={16} color={colors.text} />
            <Text style={styles.secondaryButtonText}>Compartilhar</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.mapSection}>
        <View style={styles.mapHeader}>
          <Ionicons name="map-outline" size={15} color="#6ee7b7" />
          <Text style={styles.mapTitle}>Percurso</Text>
          <Text style={styles.mapHint}>Pinça para zoom · toque duplo para aproximar</Text>
        </View>
        <View style={styles.mapFrame}>
          <RunWalkActivityTrailMap
            trail={activity.trail}
            height={240}
            interactive
            profilePhotoUri={profilePhotoUri}
          />
        </View>
      </View>

      <LinearGradient
        colors={['rgba(16, 185, 129, 0.18)', 'rgba(14, 14, 20, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.metricsCard}
      >
        <View style={styles.metricsHero}>
          <View style={styles.metricsHeroIcon}>
            <Ionicons name="footsteps-outline" size={20} color="#6ee7b7" />
          </View>
          <View style={styles.metricsHeroText}>
            <ActivityMetricValue
              parts={distanceParts}
              valueStyle={styles.heroValue}
              unitStyle={styles.heroUnit}
            />
            <Text style={styles.heroLabel}>Distância percorrida</Text>
          </View>
        </View>

        <View style={styles.metricsDivider} />

        <View style={styles.metricsGrid}>
          <MetricTile icon="time-outline" label="Tempo" parts={timeParts} accent="#93c5fd" />
          <MetricTile icon="speedometer-outline" label="Vel. média" parts={speedParts} accent="#6ee7b7" />
          <MetricTile icon="timer-outline" label="Ritmo médio" parts={paceParts} accent="#fcd34d" />
          <MetricTile
            icon="flame-outline"
            label="Calorias"
            value={formatCaloriesBurned(activity.estimatedCalories)}
            accent="#fb923c"
          />
        </View>
      </LinearGradient>

      {comparison ? (
        <View style={styles.comparisonCard}>
          <Text style={styles.sectionTitle}>Comparação com treino anterior</Text>
          <Text style={styles.comparisonText}>
            Versus {comparison.previousDateLabel}:{' '}
            {comparison.paceDeltaSeconds != null
              ? comparison.paceDeltaSeconds <= 0
                ? `${Math.abs(comparison.paceDeltaSeconds)}s mais rápido no ritmo médio`
                : `${comparison.paceDeltaSeconds}s mais lento no ritmo médio`
              : 'ritmo indisponível'}
            {comparison.distanceDeltaKm != null
              ? ` · ${comparison.distanceDeltaKm >= 0 ? '+' : ''}${comparison.distanceDeltaKm
                  .toFixed(1)
                  .replace('.', ',')} km`
              : ''}
          </Text>
        </View>
      ) : null}

      {paceSeries.length > 1 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ritmo ao longo do percurso</Text>
          <RunWalkHistoryTrendChart points={paceSeries} width={chartWidth} height={160} />
        </View>
      ) : null}

      {splits.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Splits por km</Text>
          <View style={styles.splitsTable}>
            <View style={styles.splitHeaderRow}>
              <Text style={styles.splitHeader}>Km</Text>
              <Text style={styles.splitHeader}>Tempo</Text>
              <Text style={styles.splitHeader}>Ritmo</Text>
            </View>
            {splits.map((split) => (
              <View key={`split-${split.km}`} style={styles.splitRow}>
                <Text style={styles.splitCell}>{split.km}</Text>
                <Text style={styles.splitCell}>{formatElapsedActivityTime(split.elapsedSeconds)}</Text>
                <Text style={styles.splitCell}>{formatPaceMinPerKm(split.paceMinPerKm)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </RunWalkSheetDrawer>
  )
}

function MetricTile({ icon, label, value, parts, accent = '#6ee7b7' }: MetricTileProps) {
  return (
    <View style={styles.metricTile}>
      <View style={[styles.metricTileIcon, { backgroundColor: `${accent}18` }]}>
        <Ionicons name={icon} size={15} color={accent} />
      </View>
      <View style={styles.metricTileContent}>
        <Text style={styles.metricTileLabel}>{label}</Text>
        {parts ? (
          <ActivityMetricValue
            parts={parts}
            valueStyle={styles.metricTileValue}
            unitStyle={styles.metricTileUnit}
          />
        ) : (
          <Text style={styles.metricTileValue}>{value}</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  mapSection: {
    gap: 8,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  mapTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  mapHint: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  mapFrame: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricsCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
    gap: 14,
  },
  metricsHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricsHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.24)',
  },
  metricsHeroText: {
    flex: 1,
    gap: 2,
  },
  heroValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  heroUnit: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  heroLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricTile: {
    width: '47.5%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricTileIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTileContent: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  metricTileLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricTileValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  metricTileUnit: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  comparisonCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.24)',
    gap: 6,
  },
  comparisonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  splitsTable: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  splitHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  splitHeader: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  splitRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  splitCell: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  footer: {
    gap: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
})

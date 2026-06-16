import * as Haptics from 'expo-haptics'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { ActivityPrimaryMetric } from '../../../utils/runWalkActivityStats'
import {
  formatActivityDistanceKm,
  formatElapsedActivityTime,
  formatHeartRate,
  formatPaceMinPerKm,
  formatSpeedKmh,
  formatStepCount,
} from '../../../utils/runWalkActivityStats'
import { colors } from '../../../theme/colors'
import { RunWalkActivityTrailMap } from './RunWalkActivityTrailMap'

type RunWalkActivityMainPageProps = {
  primaryMetric: ActivityPrimaryMetric
  onTogglePrimaryMetric: () => void
  elapsedSeconds: number
  distanceKm: number
  heartRateBpm: number
  stepCount: number
  currentStepLabel: string
  currentPaceMinPerKm: number | null
  currentSpeedKmh: number | null
  trail: Array<{ latitude: number; longitude: number }>
  bottomInset: number
}

type StatItemProps = {
  label: string
  value: string
  accent?: boolean
  wide?: boolean
  compactValue?: boolean
}

function StatItem({ label, value, accent = false, wide = false, compactValue = false }: StatItemProps) {
  return (
    <View style={[styles.statItem, wide && styles.statItemWide]}>
      <Text
        style={[
          styles.statValue,
          accent && styles.statValueAccent,
          compactValue && styles.statValueCompact,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

export function RunWalkActivityMainPage({
  primaryMetric,
  onTogglePrimaryMetric,
  elapsedSeconds,
  distanceKm,
  heartRateBpm,
  stepCount,
  currentStepLabel,
  currentPaceMinPerKm,
  currentSpeedKmh,
  trail,
  bottomInset,
}: RunWalkActivityMainPageProps) {
  const isPace = primaryMetric === 'pace'
  const heroValue = isPace
    ? formatPaceMinPerKm(currentPaceMinPerKm)
    : formatSpeedKmh(currentSpeedKmh)
  const heroUnit = isPace ? 'min/km' : ''

  function handleToggleMetric() {
    void Haptics.selectionAsync()
    onTogglePrimaryMetric()
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isPace ? 'Mostrar velocidade' : 'Mostrar ritmo'}
        onPress={handleToggleMetric}
        style={({ pressed }) => [styles.hero, pressed && styles.heroPressed]}
      >
        <Text style={styles.heroLabel}>{isPace ? 'Ritmo atual' : 'Velocidade atual'}</Text>
        <Text style={styles.heroValue}>{heroValue}</Text>
        {heroUnit ? <Text style={styles.heroUnit}>{heroUnit}</Text> : null}
        <Text style={styles.heroHint}>Toque para {isPace ? 'velocidade' : 'ritmo'}</Text>
      </Pressable>

      <View style={styles.statsGrid}>
        <StatItem label="Tempo" value={formatElapsedActivityTime(elapsedSeconds)} />
        <StatItem label="Distância" value={formatActivityDistanceKm(distanceKm)} />
        <StatItem label="Frequência cardíaca" value={formatHeartRate(heartRateBpm)} accent />
        <StatItem label="Passos" value={formatStepCount(stepCount)} />
        <StatItem label="Etapa atual" value={currentStepLabel} wide compactValue />
      </View>

      <View style={styles.mapSection}>
        <Text style={styles.mapTitle}>Mapa ao vivo</Text>
        <RunWalkActivityTrailMap trail={trail} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 18,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 2,
  },
  heroPressed: {
    opacity: 0.88,
  },
  heroLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroValue: {
    color: colors.text,
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 78,
    fontVariant: ['tabular-nums'],
  },
  heroUnit: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
    marginTop: -4,
  },
  heroHint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statItem: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    gap: 4,
  },
  statItemWide: {
    flexBasis: '100%',
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  statValueAccent: {
    color: '#fda4af',
  },
  statValueCompact: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  mapSection: {
    gap: 10,
  },
  mapTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
})

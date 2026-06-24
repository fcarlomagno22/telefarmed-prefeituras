import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  loadHomeHealthSummary,
  type HomeHealthMetric,
} from '../data/homeHealthSummary'
import { colors } from '../theme/colors'
import { SkeletonBone } from './SkeletonBone'

type HealthSummaryCardProps = {
  skeleton?: boolean
  onPressMetrics?: () => void
}

function MetricPill({ metric }: { metric: HomeHealthMetric }) {
  return (
    <View style={styles.metricPill}>
      <LinearGradient
        colors={[...metric.gradient]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.metricTop}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.16)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      </LinearGradient>

      <View style={styles.metricBody}>
        <Text style={styles.metricLabel}>{metric.label}</Text>
        <Text style={[styles.metricValue, metric.empty && styles.metricValueEmpty]}>
          {metric.value}
        </Text>
        {metric.unit && !metric.empty ? (
          <Text style={styles.metricUnit}>{metric.unit}</Text>
        ) : (
          <Text style={styles.metricUnitPlaceholder}> </Text>
        )}
      </View>
    </View>
  )
}

function MetricPillSkeleton() {
  return (
    <View style={styles.metricPill}>
      <SkeletonBone width="100%" height={3} borderRadius={0} />
      <View style={styles.metricBody}>
        <SkeletonBone width={40} height={8} borderRadius={4} />
        <SkeletonBone width={36} height={12} borderRadius={4} />
        <SkeletonBone width={28} height={8} borderRadius={4} />
      </View>
    </View>
  )
}

export function HealthSummaryCard({ skeleton = false, onPressMetrics }: HealthSummaryCardProps) {
  const [metrics, setMetrics] = useState<HomeHealthMetric[] | null>(null)

  useEffect(() => {
    if (skeleton) return
    let cancelled = false
    void loadHomeHealthSummary().then((summary) => {
      if (!cancelled) setMetrics(summary)
    })
    return () => {
      cancelled = true
    }
  }, [skeleton])

  const filledCount = metrics?.filter((metric) => !metric.empty).length ?? 0
  const hint =
    filledCount === 0
      ? 'Registre peso, glicemia e pressão em Minhas métricas.'
      : filledCount < 4
        ? 'Dados que você registra manualmente — sem aparelhos extras.'
        : null

  return (
    <Pressable
      disabled={!onPressMetrics || skeleton}
      onPress={() => {
        if (!onPressMetrics) return
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPressMetrics()
      }}
      style={({ pressed }) => [styles.wrapper, pressed && onPressMetrics && styles.pressed]}
      accessibilityRole={onPressMetrics ? 'button' : undefined}
      accessibilityLabel="Minha saúde. Abrir minhas métricas."
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.eyebrow}>Minha saúde</Text>
          {onPressMetrics && !skeleton ? (
            <View style={styles.linkRow}>
              <Text style={styles.linkText}>Minhas métricas</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} />
            </View>
          ) : null}
        </View>

        {skeleton ? (
          <View style={styles.metricsRow}>
            {Array.from({ length: 4 }).map((_, index) => (
              <MetricPillSkeleton key={index} />
            ))}
          </View>
        ) : (
          <>
            <View style={styles.metricsRow}>
              {(metrics ?? []).map((metric) => (
                <MetricPill key={metric.id} metric={metric} />
              ))}
            </View>
            {hint ? <Text style={styles.hint}>{hint}</Text> : null}
          </>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  pressed: {
    opacity: 0.92,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkText: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 8,
  },
  metricPill: {
    flex: 1,
    maxWidth: 88,
    minWidth: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricTop: {
    height: 3,
    width: '100%',
  },
  metricBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 9,
    gap: 2,
  },
  metricLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  metricValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  metricValueEmpty: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  metricUnit: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 11,
  },
  metricUnitPlaceholder: {
    fontSize: 9,
    lineHeight: 11,
  },
  hint: {
    marginTop: 10,
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
})

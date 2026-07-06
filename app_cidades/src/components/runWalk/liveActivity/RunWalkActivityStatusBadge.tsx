import { StyleSheet, Text, View } from 'react-native'
import type { GpsCalibrationPhase } from '../../../hooks/useGpsCalibration'
import type { GpsQuality } from '../../../hooks/useRunWalkLocation'
import { colors } from '../../../theme/colors'

type RunWalkActivityStatusBadgeProps = {
  gpsPhase: GpsCalibrationPhase
  gpsQuality: GpsQuality
  isLocating: boolean
  isOffline: boolean
  isSyncing: boolean
  pendingSyncCount: number
}

function resolveBadge(
  props: RunWalkActivityStatusBadgeProps,
): { label: string; color: string; dotColor: string } {
  const { gpsPhase, gpsQuality, isLocating, isOffline, isSyncing, pendingSyncCount } = props

  if (isSyncing || pendingSyncCount > 0) {
    return {
      label: isSyncing ? 'Sincronizando...' : `Sincronizar (${pendingSyncCount})`,
      color: '#2563eb',
      dotColor: '#3b82f6',
    }
  }

  if (isOffline) {
    return {
      label: 'Offline · gravando localmente',
      color: '#b45309',
      dotColor: '#f59e0b',
    }
  }

  if (isLocating) {
    return {
      label: 'GPS...',
      color: '#b45309',
      dotColor: '#fbbf24',
    }
  }

  if (gpsPhase === 'awaiting') {
    return {
      label: 'Calibrando GPS...',
      color: '#b45309',
      dotColor: '#fbbf24',
    }
  }

  if (gpsQuality === 'poor' || gpsQuality === 'fair') {
    return {
      label: 'Gravando · sinal fraco',
      color: '#c2410c',
      dotColor: '#f97316',
    }
  }

  return {
    label: 'Gravando',
    color: '#15803d',
    dotColor: '#22c55e',
  }
}

export function RunWalkActivityStatusBadge(props: RunWalkActivityStatusBadgeProps) {
  const badge = resolveBadge(props)

  return (
    <View style={styles.card}>
      <View style={[styles.dot, { backgroundColor: badge.dotColor }]} />
      <Text style={[styles.label, { color: badge.color }]}>{badge.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
})

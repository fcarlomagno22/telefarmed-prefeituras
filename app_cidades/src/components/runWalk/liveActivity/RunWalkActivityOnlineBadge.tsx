import { StyleSheet, Text, View } from 'react-native'
import type { GpsQuality } from '../../../hooks/useRunWalkLocation'
import { gpsQualityLabel } from '../../../hooks/useRunWalkLocation'
import { colors } from '../../../theme/colors'

type RunWalkActivityOnlineBadgeProps = {
  gpsQuality: GpsQuality
  isLocating: boolean
}

function gpsQualityColor(quality: GpsQuality, isLocating: boolean): string {
  if (isLocating) return '#fbbf24'
  switch (quality) {
    case 'excellent':
    case 'good':
      return '#22c55e'
    case 'fair':
      return '#fbbf24'
    case 'poor':
      return '#f97316'
    default:
      return '#64748b'
  }
}

export function RunWalkActivityOnlineBadge({
  gpsQuality,
  isLocating,
}: RunWalkActivityOnlineBadgeProps) {
  const gpsColor = gpsQualityColor(gpsQuality, isLocating)
  const gpsLabel = isLocating
    ? 'GPS...'
    : gpsQuality === 'unavailable'
      ? gpsQualityLabel(gpsQuality)
      : 'On-line'

  return (
    <View style={styles.root}>
      <View style={[styles.dot, { backgroundColor: gpsColor }]} />
      <Text style={styles.label}>{gpsLabel}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
})

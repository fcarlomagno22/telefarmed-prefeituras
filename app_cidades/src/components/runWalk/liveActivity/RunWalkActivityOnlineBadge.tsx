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
  const isOnline =
    !isLocating && (gpsQuality === 'excellent' || gpsQuality === 'good')

  return (
    <View style={styles.card}>
      <View style={[styles.dot, { backgroundColor: isOnline ? '#22c55e' : gpsColor }]} />
      <Text style={[styles.label, { color: isOnline ? '#15803d' : gpsColor }]}>
        {gpsLabel}
      </Text>
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

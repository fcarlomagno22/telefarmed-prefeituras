import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { GpsQuality } from '../../../hooks/useRunWalkLocation'
import { gpsQualityLabel } from '../../../hooks/useRunWalkLocation'
import { colors } from '../../../theme/colors'

type RunWalkActivityStatusBarProps = {
  gpsQuality: GpsQuality
  isLocating: boolean
  onLockPress: () => void
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

export function RunWalkActivityStatusBar({
  gpsQuality,
  isLocating,
  onLockPress,
}: RunWalkActivityStatusBarProps) {
  const gpsColor = gpsQualityColor(gpsQuality, isLocating)
  const gpsLabel = isLocating ? 'GPS...' : gpsQualityLabel(gpsQuality)

  return (
    <View style={styles.root}>
      <View style={styles.gpsChip}>
        <View style={[styles.gpsDot, { backgroundColor: gpsColor }]} />
        <Text style={styles.gpsText} numberOfLines={1}>
          {gpsLabel}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bloquear tela"
        onPress={onLockPress}
        hitSlop={8}
        style={({ pressed }) => [styles.lockButton, pressed && styles.lockButtonPressed]}
      >
        <Ionicons name="lock-closed-outline" size={16} color={colors.text} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 10, 12, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gpsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gpsText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  lockButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  lockButtonPressed: {
    opacity: 0.75,
  },
})

import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import type { NearbyOriginMode } from '../../types/nearbyUnits'
import { colors } from '../../theme/colors'

type NearbyUnitsOriginToggleProps = {
  mode: NearbyOriginMode
  label: string
  isLocating: boolean
  onSelectMode: (mode: NearbyOriginMode) => void
}

export function NearbyUnitsOriginToggle({
  mode,
  label,
  isLocating,
  onSelectMode,
}: NearbyUnitsOriginToggleProps) {
  function handleSelect(nextMode: NearbyOriginMode) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSelectMode(nextMode)
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => handleSelect('gps')}
        style={({ pressed }) => [
          styles.chip,
          mode === 'gps' && styles.chipActive,
          pressed && styles.chipPressed,
        ]}
      >
        {isLocating && mode === 'gps' ? (
          <ActivityIndicator size="small" color="#fbbf24" />
        ) : (
          <Ionicons
            name="navigate"
            size={14}
            color={mode === 'gps' ? '#fbbf24' : colors.textMuted}
          />
        )}
        <Text style={[styles.chipText, mode === 'gps' && styles.chipTextActive]}>
          Localização
        </Text>
      </Pressable>

      <Pressable
        onPress={() => handleSelect('home')}
        style={({ pressed }) => [
          styles.chip,
          mode === 'home' && styles.chipActive,
          pressed && styles.chipPressed,
        ]}
      >
        <Ionicons
          name="home-outline"
          size={14}
          color={mode === 'home' ? '#fbbf24' : colors.textMuted}
        />
        <Text style={[styles.chipText, mode === 'home' && styles.chipTextActive]}>
          Endereço
        </Text>
      </Pressable>

      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fbbf24',
  },
  label: {
    flex: 1,
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
  },
})

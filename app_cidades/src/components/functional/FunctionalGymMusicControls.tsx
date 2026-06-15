import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

type FunctionalGymMusicControlsProps = {
  volume: number
  isPaused: boolean
  onTogglePause: () => void
  onIncreaseVolume: () => void
  onDecreaseVolume: () => void
}

export function FunctionalGymMusicControls({
  volume,
  isPaused,
  onTogglePause,
  onIncreaseVolume,
  onDecreaseVolume,
}: FunctionalGymMusicControlsProps) {
  const volumePercent = Math.round(volume * 100)
  const canDecrease = volume > 0
  const canIncrease = volume < 1

  function handleTogglePause() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onTogglePause()
  }

  function handleDecrease() {
    if (!canDecrease) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onDecreaseVolume()
  }

  function handleIncrease() {
    if (!canIncrease) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onIncreaseVolume()
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={handleTogglePause}
        style={({ pressed }) => [styles.musicBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={isPaused ? 'Retomar trilha' : 'Pausar trilha'}
      >
        <Ionicons
          name={isPaused ? 'play' : 'pause'}
          size={16}
          color={isPaused ? colors.textMuted : '#fdba74'}
        />
      </Pressable>

      <Ionicons name="musical-notes-outline" size={14} color={colors.textSubtle} />

      <Pressable
        onPress={handleDecrease}
        disabled={!canDecrease}
        hitSlop={6}
        style={({ pressed }) => [
          styles.stepBtn,
          !canDecrease && styles.stepBtnDisabled,
          pressed && canDecrease && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Diminuir volume"
      >
        <Ionicons
          name="remove"
          size={16}
          color={canDecrease ? colors.text : colors.textSubtle}
        />
      </Pressable>

      <View style={styles.volumeTrack}>
        <View style={[styles.volumeFill, { width: `${volumePercent}%` }]} />
      </View>

      <Pressable
        onPress={handleIncrease}
        disabled={!canIncrease}
        hitSlop={6}
        style={({ pressed }) => [
          styles.stepBtn,
          !canIncrease && styles.stepBtnDisabled,
          pressed && canIncrease && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Aumentar volume"
      >
        <Ionicons
          name="add"
          size={16}
          color={canIncrease ? colors.text : colors.textSubtle}
        />
      </Pressable>

      <Text style={styles.volumeText}>{volumePercent}%</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  musicBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  volumeTrack: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#f97316',
  },
  volumeText: {
    width: 34,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.82,
  },
})

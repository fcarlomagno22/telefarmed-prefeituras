import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { sleepTimeDrawerTheme } from './sleepTimeDrawerTheme'

type SleepTimeSoundVolumeControlsProps = {
  volume: number
  accentColor: string
  onDecrease: () => void
  onIncrease: () => void
}

export function SleepTimeSoundVolumeControls({
  volume,
  accentColor,
  onDecrease,
  onIncrease,
}: SleepTimeSoundVolumeControlsProps) {
  const volumePercent = Math.round(volume * 100)
  const canDecrease = volume > 0
  const canIncrease = volume < 1

  function handleDecrease() {
    if (!canDecrease) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onDecrease()
  }

  function handleIncrease() {
    if (!canIncrease) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onIncrease()
  }

  return (
    <View style={styles.wrap}>
      <Ionicons name="volume-low-outline" size={18} color={sleepTimeDrawerTheme.textSubtle} />

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
          size={18}
          color={canDecrease ? sleepTimeDrawerTheme.text : sleepTimeDrawerTheme.textSubtle}
        />
      </Pressable>

      <View style={styles.volumeTrack}>
        <View style={[styles.volumeFill, { width: `${volumePercent}%`, backgroundColor: accentColor }]} />
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
          size={18}
          color={canIncrease ? sleepTimeDrawerTheme.text : sleepTimeDrawerTheme.textSubtle}
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
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: sleepTimeDrawerTheme.chipBackground,
    borderWidth: 1,
    borderColor: sleepTimeDrawerTheme.chipBorder,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  volumeTrack: {
    flex: 1,
    height: 5,
    borderRadius: 999,
    backgroundColor: sleepTimeDrawerTheme.volumeTrack,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    borderRadius: 999,
  },
  volumeText: {
    width: 38,
    color: sleepTimeDrawerTheme.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.82,
  },
})

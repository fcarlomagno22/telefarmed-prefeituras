import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

type SleepTimeSoundMiniPlayerProps = {
  title: string
  accentColor: string
  isPaused: boolean
  volume: number
  paddingTop: number
  onBack: () => void
  onTogglePause: () => void
  onDecreaseVolume: () => void
  onIncreaseVolume: () => void
  onStop: () => void
  onPress: () => void
}

export function SleepTimeSoundMiniPlayer({
  title,
  accentColor,
  isPaused,
  volume,
  paddingTop,
  onBack,
  onTogglePause,
  onDecreaseVolume,
  onIncreaseVolume,
  onStop,
  onPress,
}: SleepTimeSoundMiniPlayerProps) {
  const volumePercent = Math.round(volume * 100)
  const canDecrease = volume > 0
  const canIncrease = volume < 1

  function handleTogglePause() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onTogglePause()
  }

  function handleStop() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onStop()
  }

  function handleOpen() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <View style={[styles.wrap, { paddingTop }]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
      ) : null}
      <LinearGradient
        colors={['rgba(7, 8, 18, 0.96)', 'rgba(10, 10, 18, 0.92)']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.row}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={handleOpen}
          style={({ pressed }) => [styles.titlePressable, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`${title}. Toque para abrir o player.`}
        >
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle}>{isPaused ? 'Pausado' : 'Tocando agora'}</Text>
        </Pressable>

        <Pressable
          onPress={handleTogglePause}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={isPaused ? 'Retomar' : 'Pausar'}
        >
          <Ionicons name={isPaused ? 'play' : 'pause'} size={18} color="#fff" />
        </Pressable>

        <Pressable
          onPress={() => {
            if (!canDecrease) return
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            onDecreaseVolume()
          }}
          disabled={!canDecrease}
          style={({ pressed }) => [
            styles.iconBtn,
            !canDecrease && styles.iconBtnDisabled,
            pressed && canDecrease && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Diminuir volume"
        >
          <Ionicons name="remove" size={16} color={canDecrease ? '#fff' : colors.textSubtle} />
        </Pressable>

        <View style={styles.volumeTrack}>
          <View
            style={[styles.volumeFill, { width: `${volumePercent}%`, backgroundColor: accentColor }]}
          />
        </View>

        <Pressable
          onPress={() => {
            if (!canIncrease) return
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            onIncreaseVolume()
          }}
          disabled={!canIncrease}
          style={({ pressed }) => [
            styles.iconBtn,
            !canIncrease && styles.iconBtnDisabled,
            pressed && canIncrease && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Aumentar volume"
        >
          <Ionicons name="add" size={16} color={canIncrease ? '#fff' : colors.textSubtle} />
        </Pressable>

        <Pressable
          onPress={handleStop}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Encerrar som"
        >
          <Ionicons name="close" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  titlePressable: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconBtnDisabled: {
    opacity: 0.35,
  },
  volumeTrack: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    borderRadius: 999,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  pressed: {
    opacity: 0.82,
  },
})

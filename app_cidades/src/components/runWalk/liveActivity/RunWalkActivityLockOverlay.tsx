import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'

type RunWalkActivityLockOverlayProps = {
  visible: boolean
  onUnlock: () => void
}

const HOLD_MS = 1200

export function RunWalkActivityLockOverlay({ visible, onUnlock }: RunWalkActivityLockOverlayProps) {
  const progress = useRef(new Animated.Value(0)).current
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!visible) {
      progress.stopAnimation()
      progress.setValue(0)
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
        holdTimerRef.current = null
      }
    }
  }, [progress, visible])

  if (!visible) return null

  function clearHold() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    progress.stopAnimation()
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }

  function startHold() {
    clearHold()
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start()

    holdTimerRef.current = setTimeout(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onUnlock()
    }, HOLD_MS)
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.panel}>
        <Ionicons name="lock-closed" size={34} color={colors.text} />
        <Text style={styles.title}>Tela bloqueada</Text>
        <Text style={styles.subtitle}>Segure para desbloquear</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Segure para desbloquear"
          onPressIn={startHold}
          onPressOut={clearHold}
          style={({ pressed }) => [styles.unlockButton, pressed && styles.unlockButtonPressed]}
        >
          <Animated.View
            style={[
              styles.unlockFill,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          <Text style={styles.unlockLabel}>Segure aqui</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    backgroundColor: 'rgba(10, 10, 12, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  panel: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 18,
  },
  unlockButton: {
    width: '100%',
    height: 56,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockButtonPressed: {
    opacity: 0.95,
  },
  unlockFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(34, 197, 94, 0.28)',
  },
  unlockLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
})

import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ExerciseTimerBar } from '../components/functional/ExerciseTimerBar'
import { useAuth } from '../contexts/AuthContext'
import { clearPreparationDraft } from '../data/runWalkPreparationDraftStorage'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import { getRunWalkRouteParams } from '../types/auth'
import { playFunctionalCountdownTick } from '../utils/appSounds'

const COUNTDOWN_SECONDS = 3
const TICK_MS = 1000

export function RunWalkStartCountdownScreen() {
  const insets = useSafeAreaInsets()
  const { routeParams, navigateTo } = useAuth()
  const params = getRunWalkRouteParams(routeParams)

  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)
  const completedRef = useRef(false)
  const lastTickRef = useRef<number | null>(null)
  const progressAnim = useRef(new Animated.Value(1)).current
  const numberScale = useRef(new Animated.Value(1)).current

  const displaySeconds = Math.max(Math.ceil(secondsLeft - 1e-4), 0)

  useAndroidBackHandler(() => true)

  useEffect(() => {
    completedRef.current = false
    lastTickRef.current = null
    setSecondsLeft(COUNTDOWN_SECONDS)
    progressAnim.stopAnimation()
    progressAnim.setValue(1)
    numberScale.setValue(1)

    Animated.timing(progressAnim, {
      toValue: 0,
      duration: COUNTDOWN_SECONDS * TICK_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start()

    const timer = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          clearInterval(timer)
          return 0
        }
        return current - 1
      })
    }, TICK_MS)

    return () => {
      clearInterval(timer)
      progressAnim.stopAnimation()
    }
  }, [numberScale, progressAnim])

  useEffect(() => {
    const tick = Math.ceil(Math.max(secondsLeft, 0))
    if (tick <= 0 || tick > COUNTDOWN_SECONDS) return
    if (lastTickRef.current === tick) return

    lastTickRef.current = tick
    void playFunctionalCountdownTick()
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)

    numberScale.setValue(1.08)
    Animated.spring(numberScale, {
      toValue: 1,
      damping: 18,
      stiffness: 260,
      mass: 0.7,
      useNativeDriver: true,
    }).start()
  }, [numberScale, secondsLeft])

  useEffect(() => {
    if (secondsLeft > 0 || completedRef.current) return

    completedRef.current = true
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

    const finishTimer = setTimeout(() => {
      void clearPreparationDraft()
      navigateTo('run-walk-live', {
        modality: params.modality,
        activityName: params.activityName,
        intensity: params.intensity,
        durationMinutes: params.durationMinutes,
      })
    }, 280)

    return () => clearTimeout(finishTimer)
  }, [
    navigateTo,
    params.activityName,
    params.durationMinutes,
    params.intensity,
    params.modality,
    secondsLeft,
  ])

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(251, 191, 36, 0.16)', '#0a0a0c', '#0a0a0c']}
        locations={[0, 0.32, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.content, { paddingTop: Math.max(insets.top, 16) + 24 }]}>
        <View style={styles.timerBlock}>
          <Animated.Text
            style={[styles.countdownNumber, { transform: [{ scale: numberScale }] }]}
          >
            {displaySeconds}
          </Animated.Text>

          <ExerciseTimerBar
            secondsLeft={secondsLeft}
            totalSeconds={COUNTDOWN_SECONDS}
            phase="countdown"
            progressAnimated={progressAnim}
            showTime={false}
          />

          <Text style={styles.hint}>Posicione-se e respire</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  timerBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 18,
  },
  countdownNumber: {
    color: '#fbbf24',
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: -3,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
})

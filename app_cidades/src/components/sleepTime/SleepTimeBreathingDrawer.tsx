import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { colors } from '../../theme/colors'
import {
  playSleepBreathingSound,
  stopSleepBreathingSound,
} from '../../utils/sleepBreathingSounds'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { SleepTimeStarfield } from './SleepTimeStarfield'

type SleepTimeBreathingDrawerProps = {
  visible: boolean
  onClose: () => void
}

type BreathingPhase = 'intro' | 'countdown' | 'inhale' | 'exhale'

const COUNTDOWN_SECONDS = 3
const INHALE_DURATION_MS = 4200
const EXHALE_DURATION_MS = 4200
const INNER_DELAY_MS = 480

const ACCENT = '#67e8f9'
const ACCENT_SOFT = 'rgba(103, 232, 249, 0.28)'

export function SleepTimeBreathingDrawer({ visible, onClose }: SleepTimeBreathingDrawerProps) {
  const { width: screenWidth } = useWindowDimensions()
  const circleSize = Math.min(screenWidth * 0.68, 280)

  const [phase, setPhase] = useState<BreathingPhase>('intro')
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_SECONDS)

  const outerScale = useRef(new Animated.Value(0.42)).current
  const innerScale = useRef(new Animated.Value(0.28)).current
  const outerOpacity = useRef(new Animated.Value(0.55)).current
  const innerOpacity = useRef(new Animated.Value(0.35)).current
  const textOpacity = useRef(new Animated.Value(0)).current

  const runningRef = useRef(false)
  const phaseRef = useRef<BreathingPhase>('intro')
  const startInhalePhaseRef = useRef<() => void>(() => {})
  const startExhalePhaseRef = useRef<() => void>(() => {})

  const resetVisuals = useCallback(() => {
    outerScale.setValue(0.42)
    innerScale.setValue(0.28)
    outerOpacity.setValue(0.55)
    innerOpacity.setValue(0.35)
    textOpacity.setValue(0)
  }, [innerOpacity, innerScale, outerOpacity, outerScale, textOpacity])

  const fadeInText = useCallback(() => {
    textOpacity.setValue(0)
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [textOpacity])

  const startInhalePhase = useCallback(() => {
    if (!runningRef.current) return

    phaseRef.current = 'inhale'
    setPhase('inhale')
    fadeInText()
    outerScale.setValue(0.42)
    innerScale.setValue(0.28)
    outerOpacity.setValue(0.55)
    innerOpacity.setValue(0.35)
    void playSleepBreathingSound('inhale')

    Animated.parallel([
      Animated.timing(outerScale, {
        toValue: 1,
        duration: INHALE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(outerOpacity, {
        toValue: 1,
        duration: INHALE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(INNER_DELAY_MS),
        Animated.parallel([
          Animated.timing(innerScale, {
            toValue: 0.92,
            duration: INHALE_DURATION_MS - INNER_DELAY_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(innerOpacity, {
            toValue: 0.72,
            duration: INHALE_DURATION_MS - INNER_DELAY_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(({ finished }) => {
      if (!finished || !runningRef.current || phaseRef.current !== 'inhale') return
      startExhalePhaseRef.current()
    })
  }, [fadeInText, innerOpacity, innerScale, outerOpacity, outerScale])

  const startExhalePhase = useCallback(() => {
    if (!runningRef.current) return

    phaseRef.current = 'exhale'
    setPhase('exhale')
    fadeInText()
    void playSleepBreathingSound('exhale')

    Animated.parallel([
      Animated.timing(outerScale, {
        toValue: 0.42,
        duration: EXHALE_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(innerScale, {
        toValue: 0.28,
        duration: EXHALE_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(outerOpacity, {
        toValue: 0.55,
        duration: EXHALE_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(innerOpacity, {
        toValue: 0.35,
        duration: EXHALE_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished || !runningRef.current || phaseRef.current !== 'exhale') return
      startInhalePhaseRef.current()
    })
  }, [fadeInText, innerOpacity, innerScale, outerOpacity, outerScale])

  useEffect(() => {
    startInhalePhaseRef.current = startInhalePhase
    startExhalePhaseRef.current = startExhalePhase
  }, [startExhalePhase, startInhalePhase])

  const startCountdown = useCallback(() => {
    if (!runningRef.current) return

    phaseRef.current = 'countdown'
    setPhase('countdown')
    setCountdownValue(COUNTDOWN_SECONDS)
    fadeInText()
  }, [fadeInText])

  const startSession = useCallback(() => {
    runningRef.current = true
    phaseRef.current = 'intro'
    setPhase('intro')
    setCountdownValue(COUNTDOWN_SECONDS)
    resetVisuals()
    fadeInText()

    void playSleepBreathingSound('intro', () => {
      if (!runningRef.current) return
      startCountdown()
    })
  }, [fadeInText, resetVisuals, startCountdown])

  const stopSession = useCallback(() => {
    runningRef.current = false
    stopSleepBreathingSound()
    resetVisuals()
    setPhase('intro')
    setCountdownValue(COUNTDOWN_SECONDS)
  }, [resetVisuals])

  useEffect(() => {
    if (!visible) {
      stopSession()
      return
    }

    void activateKeepAwakeAsync('sleep-breathing-session')
    startSession()

    return () => {
      stopSession()
      deactivateKeepAwake('sleep-breathing-session')
    }
  }, [visible, startSession, stopSession])

  useEffect(() => {
    if (!visible || phase !== 'countdown') return

    if (countdownValue <= 0) {
      startInhalePhase()
      return
    }

    const timeout = setTimeout(() => {
      setCountdownValue((current) => current - 1)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [countdownValue, phase, startInhalePhase, visible])

  function handleClose() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    stopSession()
    onClose()
  }

  function handleStop() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    stopSession()
    onClose()
  }

  const phaseText = getPhaseText(phase, countdownValue)

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Respiração para relaxar"
      subtitle="Um momento de calma antes de dormir"
      onClose={handleClose}
      fullScreen
      scrollable={false}
      sheetBackground={
        <>
          <LinearGradient
            colors={['#070812', '#0a1220', '#050508']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <SleepTimeStarfield active={visible} />
        </>
      }
      footer={
        <Pressable
          onPress={handleStop}
          style={({ pressed }) => [styles.stopButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Encerrar exercício de respiração"
        >
          <Text style={styles.stopButtonText}>Encerrar</Text>
        </Pressable>
      }
    >
      <View style={styles.content}>
        <View style={[styles.circleStage, { width: circleSize, height: circleSize }]}>
          <Animated.View
            style={[
              styles.outerCircle,
              {
                width: circleSize,
                height: circleSize,
                borderRadius: circleSize / 2,
                opacity: outerOpacity,
                transform: [{ scale: outerScale }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.innerCircle,
              {
                width: circleSize * 0.62,
                height: circleSize * 0.62,
                borderRadius: (circleSize * 0.62) / 2,
                opacity: innerOpacity,
                transform: [{ scale: innerScale }],
              },
            ]}
          />
        </View>

        <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
          <Text style={styles.phaseLabel}>{phaseText.label}</Text>
          {phaseText.detail ? <Text style={styles.phaseDetail}>{phaseText.detail}</Text> : null}
        </Animated.View>
      </View>
    </RunWalkSheetDrawer>
  )
}

function getPhaseText(phase: BreathingPhase, countdownValue: number) {
  switch (phase) {
    case 'intro':
      return {
        label: 'Deite-se com calma',
        detail: 'Não precisa fazer nada além de respirar.',
      }
    case 'countdown':
      return {
        label: 'Relaxe...',
        detail: countdownValue > 0 ? String(countdownValue) : '',
      }
    case 'inhale':
      return {
        label: 'Inspira',
        detail: '',
      }
    case 'exhale':
      return {
        label: 'Expira',
        detail: '',
      }
    default:
      return { label: '', detail: '' }
  }
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    paddingTop: 8,
  },
  circleStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: ACCENT,
    backgroundColor: 'rgba(103, 232, 249, 0.06)',
  },
  innerCircle: {
    position: 'absolute',
    backgroundColor: ACCENT_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.42)',
  },
  textBlock: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    minHeight: 88,
  },
  phaseLabel: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  phaseDetail: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
  },
  stopButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.86,
  },
})

import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getExerciseById } from '../../data/functionalExercises'
import { useExerciseTimer, type ExerciseTimerConfig } from '../../hooks/useExerciseTimer'
import { colors } from '../../theme/colors'
import {
  decreaseFunctionalGymMusicVolume,
  getFunctionalGymMusicVolume,
  increaseFunctionalGymMusicVolume,
  pauseFunctionalGymMusic,
  playFunctionalCountdownTick,
  startFunctionalGymMusic,
  startFunctionalAlarm,
  stopFunctionalAlarm,
  stopFunctionalGymMusic,
} from '../../utils/appSounds'
import {
  CIRCUIT_REST_SEC,
  CIRCUIT_WORK_SEC,
  type FunctionalExercise,
  type TimerPhase,
} from '../../types/functionalTraining'
import { ExerciseTimerBar } from './ExerciseTimerBar'
import { FunctionalGymMusicControls } from './FunctionalGymMusicControls'
import { FunctionalLottie } from './FunctionalLottie'

type ExerciseSessionOverlayProps = {
  visible: boolean
  config: ExerciseTimerConfig | null
  onClose: () => void
  onCompleted: (payload: {
    totalActiveSec: number
    exerciseIds: string[]
    mode: ExerciseTimerConfig['mode']
    durationSec: number
  }) => void
  onNextExercise?: () => void
}

function getTotalSecondsForPhase(phase: TimerPhase, config: ExerciseTimerConfig | null) {
  if (!config) return 30
  if (phase === 'countdown') return 3
  if (phase === 'rest') return config.restSec ?? CIRCUIT_REST_SEC
  if (config.mode === 'circuit') return CIRCUIT_WORK_SEC
  return config.workSec
}

function getPhaseLabel(phase: TimerPhase) {
  switch (phase) {
    case 'countdown':
      return 'Prepare-se'
    case 'work':
      return 'Executar'
    case 'rest':
      return 'Descanso'
    case 'completed':
      return 'Concluído'
    default:
      return 'Pronto'
  }
}

function getPhaseColor(phase: TimerPhase) {
  switch (phase) {
    case 'countdown':
      return '#fbbf24'
    case 'work':
      return '#f97316'
    case 'rest':
      return '#64748b'
    case 'completed':
      return '#22c55e'
    default:
      return colors.primary
  }
}

export function ExerciseSessionOverlay({
  visible,
  config,
  onClose,
  onCompleted,
  onNextExercise,
}: ExerciseSessionOverlayProps) {
  const insets = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()
  const timer = useExerciseTimer(config)
  const completedReportedRef = useRef(false)
  const lastCountdownTickRef = useRef<number | null>(null)
  const [alarmRinging, setAlarmRinging] = useState(false)
  const [gymVolume, setGymVolume] = useState(getFunctionalGymMusicVolume())
  const [gymMusicPaused, setGymMusicPaused] = useState(false)

  const heroHeight = Math.max(screenHeight * 0.42, 260)

  const currentExercise = useMemo(() => {
    if (!config) return null
    const id = config.exerciseIds[timer.currentExerciseIndex]
    return getExerciseById(id) ?? null
  }, [config, timer.currentExerciseIndex])

  useEffect(() => {
    if (!visible) {
      completedReportedRef.current = false
      lastCountdownTickRef.current = null
      setAlarmRinging(false)
      setGymMusicPaused(false)
      stopFunctionalAlarm()
      stopFunctionalGymMusic()
      timer.reset()
      return
    }

    if (config) {
      timer.start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, config?.mode, config?.workSec, config?.exerciseIds.join(',')])

  useEffect(() => {
    return () => {
      stopFunctionalAlarm()
      stopFunctionalGymMusic()
    }
  }, [])

  useEffect(() => {
    if (!visible) return

    if (timer.phase === 'work' || timer.phase === 'countdown' || timer.phase === 'rest') {
      void activateKeepAwakeAsync('functional-training-session')
      return () => {
        deactivateKeepAwake('functional-training-session')
      }
    }
  }, [visible, timer.phase])

  useEffect(() => {
    if (timer.phase !== 'completed' || !config || completedReportedRef.current) return

    completedReportedRef.current = true
    onCompleted({
      totalActiveSec: timer.totalActiveSec,
      exerciseIds: config.exerciseIds,
      mode: config.mode,
      durationSec: config.workSec,
    })
  }, [timer.phase, timer.totalActiveSec, config, onCompleted])

  const totalSeconds = getTotalSecondsForPhase(timer.phase, config)
  const isCompleted = timer.phase === 'completed'
  const isCountdown = timer.phase === 'countdown'
  const isWork = timer.phase === 'work'
  const showCircuitProgress =
    config?.mode === 'circuit' && config.exerciseIds.length > 1
  const phaseColor = getPhaseColor(timer.phase)

  const shouldPlayGymMusic =
    visible && isWork && !timer.isPaused && !gymMusicPaused

  useEffect(() => {
    if (shouldPlayGymMusic) {
      void startFunctionalGymMusic(gymVolume)
      return
    }

    pauseFunctionalGymMusic()
  }, [shouldPlayGymMusic, gymVolume])

  useEffect(() => {
    if (!visible || timer.phase !== 'countdown' || timer.isPaused) return

    const tick = timer.secondsLeft
    if (tick <= 0 || tick > 3) return
    if (lastCountdownTickRef.current === tick) return

    lastCountdownTickRef.current = tick
    void playFunctionalCountdownTick()
  }, [visible, timer.phase, timer.secondsLeft, timer.isPaused])

  useEffect(() => {
    if (timer.phase !== 'countdown') {
      lastCountdownTickRef.current = null
    }
  }, [timer.phase])

  useEffect(() => {
    if (timer.phase !== 'completed') return

    pauseFunctionalGymMusic()
    setAlarmRinging(true)
    void startFunctionalAlarm()
  }, [timer.phase])

  function dismissAlarm() {
    stopFunctionalAlarm()
    setAlarmRinging(false)
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }

  function handleClose() {
    dismissAlarm()
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    timer.reset()
    onClose()
  }

  function handlePauseToggle() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (timer.isPaused) timer.resume()
    else timer.pause()
  }

  function handleAddTime() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    timer.addTime(10)
  }

  function handleRepeat() {
    dismissAlarm()
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    completedReportedRef.current = false
    lastCountdownTickRef.current = null
    timer.reset()
    timer.start()
  }

  function handleNext() {
    if (!onNextExercise) return
    dismissAlarm()
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onNextExercise()
  }

  function handleToggleGymMusic() {
    setGymMusicPaused((paused) => !paused)
  }

  function handleDecreaseGymVolume() {
    setGymVolume(decreaseFunctionalGymMusicVolume())
  }

  function handleIncreaseGymVolume() {
    setGymVolume(increaseFunctionalGymMusicVolume())
  }

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <View style={styles.root}>
        <LinearGradient
          colors={[`${phaseColor}22`, '#0a0a0c', '#0a0a0c']}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFill}
        />

        {isCompleted ? (
          <CompletedPanel
            exercise={currentExercise}
            isCircuit={config?.mode === 'circuit'}
            alarmRinging={alarmRinging}
            onStopAlarm={dismissAlarm}
            onRepeat={handleRepeat}
            onNext={config?.mode === 'single' ? handleNext : undefined}
            onClose={handleClose}
            topInset={insets.top}
            bottomInset={insets.bottom}
          />
        ) : (
          <>
            <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Fechar treino"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>

              <View style={styles.topCenter}>
                <Text style={styles.topEyebrow}>
                  {config?.mode === 'circuit' ? 'Circuito' : 'Treino guiado'}
                </Text>
                <Text style={styles.topTitle} numberOfLines={1}>
                  {currentExercise?.name ?? 'Treino funcional'}
                </Text>
              </View>

              <View style={styles.closeBtnSpacer} />
            </View>

            {showCircuitProgress ? (
              <View style={styles.circuitRow}>
                {config!.exerciseIds.map((id, index) => (
                  <View
                    key={id}
                    style={[
                      styles.circuitSegment,
                      index === timer.currentExerciseIndex && {
                        backgroundColor: phaseColor,
                      },
                      index < timer.currentExerciseIndex && styles.circuitSegmentDone,
                    ]}
                  />
                ))}
              </View>
            ) : null}

            <View style={[styles.hero, { height: heroHeight }]}>
              {currentExercise ? (
                <FunctionalLottie
                  source={currentExercise.lottie}
                  exerciseId={currentExercise.id}
                  style={styles.heroLottie}
                  variant="immersive"
                  autoPlay={!timer.isPaused}
                />
              ) : null}

              <LinearGradient
                colors={['transparent', 'rgba(10, 10, 12, 0.55)', '#0a0a0c']}
                locations={[0.45, 0.82, 1]}
                style={styles.heroFade}
                pointerEvents="none"
              />
            </View>

            <View style={styles.timerSection}>
              <View style={[styles.phaseBadge, { borderColor: `${phaseColor}44` }]}>
                <View style={[styles.phaseDot, { backgroundColor: phaseColor }]} />
                <Text style={[styles.phaseBadgeText, { color: phaseColor }]}>
                  {getPhaseLabel(timer.phase)}
                </Text>
                {showCircuitProgress ? (
                  <Text style={styles.phaseMeta}>
                    {timer.currentExerciseIndex + 1}/{timer.totalExercises}
                  </Text>
                ) : null}
              </View>

              <ExerciseTimerBar
                secondsLeft={timer.secondsLeft}
                totalSeconds={totalSeconds}
                phase={timer.phase}
              />

              {isCountdown ? (
                <Text style={styles.countdownHint}>Posicione-se e respire</Text>
              ) : null}

              {timer.phase === 'rest' ? (
                <Text style={styles.restHint}>Recupere o fôlego para o próximo</Text>
              ) : null}
            </View>

            <View style={[styles.dock, { paddingBottom: insets.bottom + 10 }]}>
              {isWork ? (
                <FunctionalGymMusicControls
                  volume={gymVolume}
                  isPaused={gymMusicPaused}
                  onTogglePause={handleToggleGymMusic}
                  onIncreaseVolume={handleIncreaseGymVolume}
                  onDecreaseVolume={handleDecreaseGymVolume}
                />
              ) : null}

              <View style={styles.actionRow}>
                <Pressable
                  onPress={handlePauseToggle}
                  style={({ pressed }) => [styles.actionPrimary, pressed && styles.pressed]}
                >
                  <Ionicons
                    name={timer.isPaused ? 'play' : 'pause'}
                    size={22}
                    color="#fff"
                  />
                  <Text style={styles.actionPrimaryText}>
                    {timer.isPaused ? 'Continuar' : 'Pausar'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleAddTime}
                  style={({ pressed }) => [styles.actionSecondary, pressed && styles.pressed]}
                >
                  <Text style={styles.actionSecondaryPlus}>+</Text>
                  <Text style={styles.actionSecondaryText}>10s</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  )
}

function CompletedPanel({
  exercise,
  isCircuit,
  alarmRinging,
  onStopAlarm,
  onRepeat,
  onNext,
  onClose,
  topInset,
  bottomInset,
}: {
  exercise: FunctionalExercise | null
  isCircuit: boolean
  alarmRinging: boolean
  onStopAlarm: () => void
  onRepeat: () => void
  onNext?: () => void
  onClose: () => void
  topInset: number
  bottomInset: number
}) {
  return (
    <View style={[styles.completedRoot, { paddingTop: topInset + 24, paddingBottom: bottomInset + 24 }]}>
      <LinearGradient
        colors={['rgba(34, 197, 94, 0.18)', 'transparent']}
        style={styles.completedGlow}
        pointerEvents="none"
      />

      {alarmRinging ? (
        <Pressable
          onPress={onStopAlarm}
          style={({ pressed }) => [styles.stopAlarmBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Parar alarme"
        >
          <Ionicons name="notifications" size={24} color="#fff" />
          <Text style={styles.stopAlarmText}>Parar alarme</Text>
        </Pressable>
      ) : (
        <View style={styles.completedIcon}>
          <Ionicons name="checkmark-circle" size={72} color="#22c55e" />
        </View>
      )}

      <Text style={styles.completedTitle}>
        {isCircuit ? 'Circuito concluído!' : 'Série concluída!'}
      </Text>
      <Text style={styles.completedSubtitle}>
        {exercise
          ? `Parabéns por completar ${isCircuit ? 'o circuito' : exercise.name}.`
          : 'Parabéns por completar o treino.'}
      </Text>

      {alarmRinging ? (
        <Text style={styles.alarmHint}>Toque em &quot;Parar alarme&quot; para continuar.</Text>
      ) : (
        <View style={styles.completedActions}>
          <Pressable
            onPress={onRepeat}
            style={({ pressed }) => [styles.completedPrimary, pressed && styles.pressed]}
          >
            <Text style={styles.completedPrimaryText}>Repetir</Text>
          </Pressable>

          {onNext ? (
            <Pressable
              onPress={onNext}
              style={({ pressed }) => [styles.completedSecondary, pressed && styles.pressed]}
            >
              <Text style={styles.completedSecondaryText}>Próximo exercício</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.completedGhost, pressed && styles.pressed]}
          >
            <Text style={styles.completedGhostText}>Voltar ao catálogo</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  closeBtnSpacer: {
    width: 38,
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  topEyebrow: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  topTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  circuitRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    marginBottom: 4,
    zIndex: 2,
  },
  circuitSegment: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circuitSegmentDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.65)',
  },
  hero: {
    width: '100%',
    overflow: 'hidden',
  },
  heroLottie: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  heroFade: {
    ...StyleSheet.absoluteFillObject,
  },
  timerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
    marginTop: -28,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
  },
  phaseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  phaseBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  phaseMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 2,
  },
  countdownHint: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  restHint: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  dock: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 17,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  actionPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  actionSecondary: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionSecondaryPlus: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  actionSecondaryText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: -2,
  },
  completedRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  completedGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  completedIcon: {
    marginBottom: 12,
  },
  stopAlarmBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    marginBottom: 20,
  },
  stopAlarmText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  alarmHint: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  completedTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  completedSubtitle: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 28,
  },
  completedActions: {
    width: '100%',
    gap: 10,
  },
  completedPrimary: {
    alignItems: 'center',
    paddingVertical: 17,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  completedPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  completedSecondary: {
    alignItems: 'center',
    paddingVertical: 17,
    borderRadius: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.28)',
  },
  completedSecondaryText: {
    color: '#fed7aa',
    fontSize: 16,
    fontWeight: '700',
  },
  completedGhost: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  completedGhostText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.88,
  },
})

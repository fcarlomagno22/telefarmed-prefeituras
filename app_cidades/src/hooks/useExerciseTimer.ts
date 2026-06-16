import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CIRCUIT_REST_SEC,
  CIRCUIT_WORK_SEC,
  type TimerPhase,
  type WorkoutMode,
} from '../types/functionalTraining'

export type ExerciseTimerConfig = {
  mode: WorkoutMode
  workSec: number
  restSec?: number
  exerciseIds: string[]
  startIndex?: number
}

const COUNTDOWN_START = 3

function getWorkSec(config: ExerciseTimerConfig) {
  return config.mode === 'circuit' ? CIRCUIT_WORK_SEC : config.workSec
}

export function useExerciseTimer(config: ExerciseTimerConfig | null) {
  const [phase, setPhase] = useState<TimerPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(config?.startIndex ?? 0)
  const [isPaused, setIsPaused] = useState(false)
  const [totalActiveSec, setTotalActiveSec] = useState(0)

  const configRef = useRef(config)
  const indexRef = useRef(currentExerciseIndex)
  const phaseEndAtRef = useRef(0)
  const phaseDurationRef = useRef(0)
  const pausedRemainingMsRef = useRef(0)
  const timerGenerationRef = useRef(0)

  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    indexRef.current = currentExerciseIndex
  }, [currentExerciseIndex])

  const schedulePhase = useCallback((nextPhase: TimerPhase, durationSec: number) => {
    timerGenerationRef.current += 1
    phaseDurationRef.current = durationSec
    phaseEndAtRef.current = Date.now() + durationSec * 1000
    pausedRemainingMsRef.current = 0
    setPhase(nextPhase)
    setSecondsLeft(durationSec)
  }, [])

  const reset = useCallback(() => {
    timerGenerationRef.current += 1
    setPhase('idle')
    setSecondsLeft(0)
    phaseDurationRef.current = 0
    phaseEndAtRef.current = 0
    pausedRemainingMsRef.current = 0
    setCurrentExerciseIndex(config?.startIndex ?? 0)
    indexRef.current = config?.startIndex ?? 0
    setIsPaused(false)
    setTotalActiveSec(0)
  }, [config?.startIndex])

  const triggerCompletionHaptic = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }, [])

  const start = useCallback(() => {
    if (!configRef.current) return

    const startIndex = configRef.current.startIndex ?? 0
    setIsPaused(false)
    setTotalActiveSec(0)
    setCurrentExerciseIndex(startIndex)
    indexRef.current = startIndex
    schedulePhase('countdown', COUNTDOWN_START)
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }, [schedulePhase])

  const pause = useCallback(() => {
    if (phase === 'idle' || phase === 'completed' || isPaused) return

    const remainingMs = Math.max(phaseEndAtRef.current - Date.now(), 0)
    pausedRemainingMsRef.current = remainingMs
    timerGenerationRef.current += 1
    setIsPaused(true)
  }, [isPaused, phase])

  const resume = useCallback(() => {
    if (!isPaused) return

    const remainingMs = pausedRemainingMsRef.current
    phaseEndAtRef.current = Date.now() + remainingMs
    phaseDurationRef.current = remainingMs / 1000
    timerGenerationRef.current += 1
    setIsPaused(false)
  }, [isPaused])

  const addTime = useCallback((extraSec: number) => {
    phaseEndAtRef.current += extraSec * 1000
    phaseDurationRef.current += extraSec
    setSecondsLeft((prev) => prev + extraSec)
  }, [])

  const advancePhase = useCallback(() => {
    const currentConfig = configRef.current
    if (!currentConfig) return

    if (phase === 'countdown') {
      schedulePhase('work', getWorkSec(currentConfig))
      return
    }

    if (phase === 'work') {
      const workSec = getWorkSec(currentConfig)
      setTotalActiveSec((prev) => prev + workSec)

      const isLast = indexRef.current >= currentConfig.exerciseIds.length - 1

      if (currentConfig.mode === 'single' || isLast) {
        timerGenerationRef.current += 1
        setPhase('completed')
        setSecondsLeft(0)
        triggerCompletionHaptic()
        return
      }

      schedulePhase('rest', currentConfig.restSec ?? CIRCUIT_REST_SEC)
      return
    }

    if (phase === 'rest') {
      const nextIndex = indexRef.current + 1
      indexRef.current = nextIndex
      setCurrentExerciseIndex(nextIndex)
      schedulePhase('work', CIRCUIT_WORK_SEC)
    }
  }, [phase, schedulePhase, triggerCompletionHaptic])

  useEffect(() => {
    if (phase === 'idle' || phase === 'completed' || isPaused) return

    const generation = timerGenerationRef.current
    let rafId = 0
    let lastHapticSecond = Number.POSITIVE_INFINITY

    const tick = () => {
      if (generation !== timerGenerationRef.current) return

      const remainingMs = Math.max(phaseEndAtRef.current - Date.now(), 0)
      const remainingSec = remainingMs / 1000
      setSecondsLeft(remainingSec)

      const displaySecond = Math.ceil(remainingSec)
      if (
        displaySecond <= 3 &&
        displaySecond > 0 &&
        displaySecond < lastHapticSecond &&
        (phase === 'work' || phase === 'rest' || phase === 'countdown')
      ) {
        lastHapticSecond = displaySecond
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }

      if (remainingMs <= 0) {
        advancePhase()
        return
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [advancePhase, isPaused, phase])

  return {
    phase,
    secondsLeft,
    currentExerciseIndex,
    totalExercises: config?.exerciseIds.length ?? 0,
    isPaused,
    totalActiveSec,
    start,
    pause,
    resume,
    reset,
    addTime,
  }
}

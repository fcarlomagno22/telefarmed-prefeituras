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

export function useExerciseTimer(config: ExerciseTimerConfig | null) {
  const [phase, setPhase] = useState<TimerPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(config?.startIndex ?? 0)
  const [isPaused, setIsPaused] = useState(false)
  const [totalActiveSec, setTotalActiveSec] = useState(0)

  const configRef = useRef(config)
  const indexRef = useRef(currentExerciseIndex)

  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    indexRef.current = currentExerciseIndex
  }, [currentExerciseIndex])

  const reset = useCallback(() => {
    setPhase('idle')
    setSecondsLeft(0)
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
    setPhase('countdown')
    setSecondsLeft(COUNTDOWN_START)
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }, [])

  const pause = useCallback(() => setIsPaused(true), [])
  const resume = useCallback(() => setIsPaused(false), [])

  const addTime = useCallback((extraSec: number) => {
    setSecondsLeft((prev) => prev + extraSec)
  }, [])

  useEffect(() => {
    if (phase === 'idle' || phase === 'completed' || isPaused) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [phase, isPaused])

  useEffect(() => {
    if (isPaused || secondsLeft > 0) return
    if (phase === 'idle' || phase === 'completed') return

    const currentConfig = configRef.current
    if (!currentConfig) return

    if (phase === 'countdown') {
      const workSec =
        currentConfig.mode === 'circuit' ? CIRCUIT_WORK_SEC : currentConfig.workSec
      setPhase('work')
      setSecondsLeft(workSec)
      return
    }

    if (phase === 'work') {
      const workSec =
        currentConfig.mode === 'circuit' ? CIRCUIT_WORK_SEC : currentConfig.workSec
      setTotalActiveSec((prev) => prev + workSec)

      const isLast = indexRef.current >= currentConfig.exerciseIds.length - 1

      if (currentConfig.mode === 'single' || isLast) {
        setPhase('completed')
        triggerCompletionHaptic()
        return
      }

      setPhase('rest')
      setSecondsLeft(currentConfig.restSec ?? CIRCUIT_REST_SEC)
      return
    }

    if (phase === 'rest') {
      const nextIndex = indexRef.current + 1
      indexRef.current = nextIndex
      setCurrentExerciseIndex(nextIndex)
      setPhase('work')
      setSecondsLeft(CIRCUIT_WORK_SEC)
    }
  }, [secondsLeft, phase, isPaused, triggerCompletionHaptic])

  useEffect(() => {
    if (phase !== 'work' && phase !== 'rest' && phase !== 'countdown') return
    if (isPaused) return
    if (secondsLeft > 3 || secondsLeft <= 0) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [secondsLeft, phase, isPaused])

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

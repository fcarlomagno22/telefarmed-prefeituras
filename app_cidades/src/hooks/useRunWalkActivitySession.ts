import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ActivityModality } from '../types/auth'
import type { RunWalkActivityStep } from '../types/runWalk'
import { GpsMotionEngine } from '../utils/gpsMotionEngine'
import type { GeoCoordinates } from '../utils/geo'
import {
  calculateAverageSpeedKmh,
  estimateHeartRateBpm,
  estimateStepsFromDistance,
  getDefaultActivitySteps,
  getFallbackPaceMinPerKm,
  resolveCurrentActivityStep,
  type ActivityTrailPoint,
} from '../utils/runWalkActivityStats'

type UseRunWalkActivitySessionOptions = {
  modality: ActivityModality
  durationMinutes: number
  coordinates: GeoCoordinates | null
  gpsSpeedMps?: number | null
  accuracyMeters?: number | null
  structure?: RunWalkActivityStep[]
  enabled?: boolean
}

type ActivitySessionSnapshot = {
  elapsedSeconds: number
  distanceKm: number
  currentSpeedKmh: number
  averageSpeedKmh: number
  trail: ActivityTrailPoint[]
}

export function useRunWalkActivitySession({
  modality,
  durationMinutes,
  coordinates,
  gpsSpeedMps = null,
  accuracyMeters = null,
  structure,
  enabled = true,
}: UseRunWalkActivitySessionOptions) {
  const startedAtRef = useRef(Date.now())
  const motionEngineRef = useRef(new GpsMotionEngine())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [motionSnapshot, setMotionSnapshot] = useState(() => motionEngineRef.current.getSnapshot())
  const [isFinished, setIsFinished] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [frozenSnapshot, setFrozenSnapshot] = useState<ActivitySessionSnapshot | null>(null)
  const elapsedSecondsRef = useRef(0)
  const pausedElapsedRef = useRef(0)
  const lastIngestedAtRef = useRef<number | null>(null)

  const isTracking = enabled && !isFinished && !isPaused

  const activitySteps = useMemo(
    () => structure ?? getDefaultActivitySteps(modality, durationMinutes),
    [durationMinutes, modality, structure],
  )

  useEffect(() => {
    if (!enabled) return

    startedAtRef.current = Date.now()
    elapsedSecondsRef.current = 0
    lastIngestedAtRef.current = null
    motionEngineRef.current.reset()
    setMotionSnapshot(motionEngineRef.current.getSnapshot())
    setElapsedSeconds(0)
    setIsFinished(false)
    setIsPaused(false)
    setFrozenSnapshot(null)
    pausedElapsedRef.current = 0
  }, [enabled, modality, durationMinutes])

  useEffect(() => {
    if (!isTracking) return

    const timer = setInterval(() => {
      const nextElapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
      elapsedSecondsRef.current = nextElapsed
      setElapsedSeconds(nextElapsed)
    }, 1000)

    return () => clearInterval(timer)
  }, [isTracking])

  useEffect(() => {
    if (!isTracking || !coordinates) return

    const now = Date.now()
    if (lastIngestedAtRef.current != null && now - lastIngestedAtRef.current < 400) {
      return
    }

    lastIngestedAtRef.current = now
    const snapshot = motionEngineRef.current.ingest({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      accuracyMeters,
      speedMps: gpsSpeedMps,
      recordedAt: now,
    })
    setMotionSnapshot(snapshot)
  }, [accuracyMeters, coordinates, gpsSpeedMps, isTracking])

  const liveDistanceKm = motionSnapshot.distanceKm
  const liveAverageSpeedKmh = motionSnapshot.averageSpeedKmh
  const liveSpeedKmh = motionSnapshot.currentSpeedKmh
  const trail = motionSnapshot.trail

  const finishActivity = () => {
    if (isFinished) return

    const motion = motionEngineRef.current.getSnapshot()
    const snapshotDistanceKm = motion.distanceKm
    const averageSpeed =
      motion.movingTimeSeconds >= 3 && snapshotDistanceKm > 0
        ? motion.averageSpeedKmh
        : calculateAverageSpeedKmh(snapshotDistanceKm, motion.movingTimeSeconds) ?? 0

    const snapshot: ActivitySessionSnapshot = {
      elapsedSeconds: elapsedSecondsRef.current,
      distanceKm: snapshotDistanceKm,
      currentSpeedKmh: motion.currentSpeedKmh,
      averageSpeedKmh: averageSpeed,
      trail: [...motion.trail],
    }

    setFrozenSnapshot(snapshot)
    setIsFinished(true)
    setIsPaused(false)
  }

  const pauseActivity = useCallback(() => {
    if (isFinished || isPaused) return

    pausedElapsedRef.current = elapsedSecondsRef.current
    setIsPaused(true)
  }, [isFinished, isPaused])

  const resumeActivity = useCallback(() => {
    if (isFinished || !isPaused) return

    startedAtRef.current = Date.now() - pausedElapsedRef.current * 1000
    setIsPaused(false)
  }, [isFinished, isPaused])

  const togglePauseActivity = useCallback(() => {
    if (isPaused) resumeActivity()
    else pauseActivity()
  }, [isPaused, pauseActivity, resumeActivity])

  const activeElapsedSeconds = frozenSnapshot?.elapsedSeconds ?? elapsedSeconds
  const activeDistanceKm = frozenSnapshot?.distanceKm ?? liveDistanceKm
  const activeAverageSpeedKmh = frozenSnapshot?.averageSpeedKmh ?? liveAverageSpeedKmh
  const activeSpeedKmh = frozenSnapshot?.currentSpeedKmh ?? liveSpeedKmh
  const activeTrail = frozenSnapshot?.trail ?? trail
  const stepCount = estimateStepsFromDistance(activeDistanceKm, modality)
  const heartRateBpm = estimateHeartRateBpm(modality, activeElapsedSeconds)
  const currentStep = resolveCurrentActivityStep(
    activitySteps,
    activeElapsedSeconds,
    durationMinutes,
  )

  return {
    elapsedSeconds: activeElapsedSeconds,
    distanceKm: activeDistanceKm,
    currentPaceMinPerKm: liveDistanceKm > 0 ? null : getFallbackPaceMinPerKm(modality),
    currentSpeedKmh: activeSpeedKmh,
    averageSpeedKmh: activeAverageSpeedKmh,
    stepCount,
    heartRateBpm,
    trail: activeTrail,
    currentStep,
    activitySteps,
    isFinished,
    isPaused,
    finishActivity,
    pauseActivity,
    resumeActivity,
    togglePauseActivity,
  }
}

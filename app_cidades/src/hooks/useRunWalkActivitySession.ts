import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ActivityModality } from '../types/auth'
import type { RunWalkActivityStep } from '../types/runWalk'
import type { GeoCoordinates } from '../utils/geo'
import {
  calculateAverageSpeedKmh,
  calculateInstantSpeedKmh,
  calculateRollingPaceAndSpeed,
  calculateTotalDistanceKm,
  estimateHeartRateBpm,
  estimateStepsFromDistance,
  getDefaultActivitySteps,
  getFallbackPaceMinPerKm,
  paceMinPerKmToSpeedKmh,
  resolveCurrentActivityStep,
  shouldAppendTrailPoint,
  type ActivityTrailPoint,
} from '../utils/runWalkActivityStats'

type UseRunWalkActivitySessionOptions = {
  modality: ActivityModality
  durationMinutes: number
  coordinates: GeoCoordinates | null
  gpsSpeedMps?: number | null
  structure?: RunWalkActivityStep[]
  enabled?: boolean
}

type ActivitySessionSnapshot = {
  elapsedSeconds: number
  distanceKm: number
  currentSpeedKmh: number | null
  trail: ActivityTrailPoint[]
}

export function useRunWalkActivitySession({
  modality,
  durationMinutes,
  coordinates,
  gpsSpeedMps = null,
  structure,
  enabled = true,
}: UseRunWalkActivitySessionOptions) {
  const startedAtRef = useRef(Date.now())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [trail, setTrail] = useState<ActivityTrailPoint[]>([])
  const [isFinished, setIsFinished] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [frozenSnapshot, setFrozenSnapshot] = useState<ActivitySessionSnapshot | null>(null)
  const elapsedSecondsRef = useRef(0)
  const trailRef = useRef<ActivityTrailPoint[]>([])
  const pausedElapsedRef = useRef(0)

  const isTracking = enabled && !isFinished && !isPaused

  const activitySteps = useMemo(
    () => structure ?? getDefaultActivitySteps(modality, durationMinutes),
    [durationMinutes, modality, structure],
  )

  useEffect(() => {
    if (!enabled) return

    startedAtRef.current = Date.now()
    elapsedSecondsRef.current = 0
    trailRef.current = []
    setElapsedSeconds(0)
    setTrail([])
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

    setTrail((current) => {
      if (!shouldAppendTrailPoint(current, coordinates, 4)) {
        return current
      }

      const nextTrail = [
        ...current,
        {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          recordedAt: Date.now(),
        },
      ]
      trailRef.current = nextTrail
      return nextTrail
    })
  }, [coordinates, isTracking])

  const liveDistanceKm = useMemo(() => calculateTotalDistanceKm(trail), [trail])
  const liveAverageSpeedKmh = useMemo(
    () => calculateAverageSpeedKmh(liveDistanceKm, elapsedSeconds),
    [elapsedSeconds, liveDistanceKm],
  )
  const rollingMetrics = useMemo(() => calculateRollingPaceAndSpeed(trail), [trail])

  const livePaceMinPerKm =
    rollingMetrics.paceMinPerKm ??
    (liveDistanceKm > 0 ? null : getFallbackPaceMinPerKm(modality))
  const liveSpeedKmh =
    calculateInstantSpeedKmh(trail, gpsSpeedMps) ??
    rollingMetrics.speedKmh ??
    (livePaceMinPerKm != null ? paceMinPerKmToSpeedKmh(livePaceMinPerKm) : null)

  const finishActivity = () => {
    if (isFinished) return

    const currentTrail = trailRef.current
    const snapshotDistanceKm = calculateTotalDistanceKm(currentTrail)
    const rolling = calculateRollingPaceAndSpeed(currentTrail)
    const pace =
      rolling.paceMinPerKm ??
      (snapshotDistanceKm > 0 ? null : getFallbackPaceMinPerKm(modality))
    const speed =
      calculateInstantSpeedKmh(currentTrail, gpsSpeedMps) ??
      rolling.speedKmh ??
      (pace != null ? paceMinPerKmToSpeedKmh(pace) : null)

    const snapshot: ActivitySessionSnapshot = {
      elapsedSeconds: elapsedSecondsRef.current,
      distanceKm: snapshotDistanceKm,
      currentSpeedKmh: speed,
      trail: [...currentTrail],
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
  const activeAverageSpeedKmh = frozenSnapshot
    ? calculateAverageSpeedKmh(frozenSnapshot.distanceKm, frozenSnapshot.elapsedSeconds)
    : liveAverageSpeedKmh
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
    currentPaceMinPerKm: livePaceMinPerKm,
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

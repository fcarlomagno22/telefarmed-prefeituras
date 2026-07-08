import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ActivityModality } from '../types/auth'
import type { RunWalkActivityStep } from '../types/runWalk'
import { GpsMotionEngine } from '../utils/gpsMotionEngine'
import { RunWalkDisplaySpeedTracker } from '../utils/runWalkDisplaySpeed'
import {
  calculateAverageSpeedKmh,
  estimateHeartRateBpm,
  estimateStepsFromDistance,
  getDefaultActivitySteps,
  getFallbackPaceMinPerKm,
  resolveCurrentActivityStep,
  type ActivityTrailPoint,
} from '../utils/runWalkActivityStats'
import {
  createListenerRegistry,
  type RunWalkLiveGpsFeed,
  type RunWalkLiveMapTrailFeed,
} from './runWalkLiveGpsFeed'

const METRICS_INGEST_MIN_INTERVAL_MS = 50
const METRICS_UI_INTERVAL_MS = 500
const DISPLAY_SPEED_UI_INTERVAL_MS = 200
const DISPLAY_SPEED_INGEST_PUBLISH_MS = 200

type UseRunWalkActivitySessionOptions = {
  modality: ActivityModality
  durationMinutes: number
  gpsFeed: RunWalkLiveGpsFeed | null
  structure?: RunWalkActivityStep[]
  enabled?: boolean
  gpsRecordingEnabled?: boolean
}

type ActivitySessionSnapshot = {
  elapsedSeconds: number
  distanceKm: number
  currentSpeedKmh: number
  displaySpeedKmh: number
  averageSpeedKmh: number
  trail: ActivityTrailPoint[]
}

type SessionMetricsState = {
  elapsedSeconds: number
  distanceKm: number
  currentSpeedKmh: number
  displaySpeedKmh: number
  averageSpeedKmh: number
  trail: ActivityTrailPoint[]
}

export function useRunWalkActivitySession({
  modality,
  durationMinutes,
  gpsFeed,
  structure,
  enabled = true,
  gpsRecordingEnabled = true,
}: UseRunWalkActivitySessionOptions) {
  const startedAtRef = useRef(Date.now())
  const motionEngineRef = useRef(new GpsMotionEngine())
  const displaySpeedTrackerRef = useRef(new RunWalkDisplaySpeedTracker())
  const trailRef = useRef<ActivityTrailPoint[]>([])
  const displaySpeedRef = useRef(0)
  const trailListenersRef = useRef(createListenerRegistry())
  const gpsRecordingEnabledRef = useRef(gpsRecordingEnabled)
  const [metrics, setMetrics] = useState<SessionMetricsState>({
    elapsedSeconds: 0,
    distanceKm: 0,
    currentSpeedKmh: 0,
    displaySpeedKmh: 0,
    averageSpeedKmh: 0,
    trail: [],
  })
  const [isFinished, setIsFinished] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [frozenSnapshot, setFrozenSnapshot] = useState<ActivitySessionSnapshot | null>(null)
  const elapsedSecondsRef = useRef(0)
  const pausedElapsedRef = useRef(0)
  const lastIngestedAtRef = useRef<number | null>(null)
  const lastSpeedPublishAtRef = useRef(0)
  const wasRecordingGpsRef = useRef(gpsRecordingEnabled)
  const isTrackingRef = useRef(false)

  const isTracking = enabled && !isFinished && !isPaused

  useEffect(() => {
    isTrackingRef.current = isTracking
  }, [isTracking])

  useEffect(() => {
    gpsRecordingEnabledRef.current = gpsRecordingEnabled
  }, [gpsRecordingEnabled])

  const publishMetrics = useCallback((patch: Partial<SessionMetricsState>) => {
    setMetrics((prev) => ({ ...prev, ...patch }))
  }, [])

  const syncMotionMetrics = useCallback(() => {
    const motion = motionEngineRef.current.getSnapshot()
    trailRef.current = motion.trail
    trailListenersRef.current.notify()
    publishMetrics({
      elapsedSeconds: elapsedSecondsRef.current,
      distanceKm: motion.distanceKm,
      currentSpeedKmh: motion.currentSpeedKmh,
      averageSpeedKmh: motion.averageSpeedKmh,
      trail: [...motion.trail],
    })
  }, [publishMetrics])

  const ingestGpsFix = useCallback(() => {
    if (!isTrackingRef.current || !gpsFeed) return

    const fix = gpsFeed.getGpsFix()
    if (!fix) return

    const now = fix.recordedAt
    displaySpeedRef.current = displaySpeedTrackerRef.current.ingest({
      latitude: fix.coordinates.latitude,
      longitude: fix.coordinates.longitude,
      speedMps: fix.speedMps,
      recordedAt: now,
    })

    if (Date.now() - lastSpeedPublishAtRef.current >= DISPLAY_SPEED_INGEST_PUBLISH_MS) {
      lastSpeedPublishAtRef.current = Date.now()
      publishMetrics({ displaySpeedKmh: displaySpeedRef.current })
    }

    if (!gpsRecordingEnabledRef.current) return

    if (
      lastIngestedAtRef.current != null &&
      now - lastIngestedAtRef.current < METRICS_INGEST_MIN_INTERVAL_MS
    ) {
      return
    }

    lastIngestedAtRef.current = now
    motionEngineRef.current.ingest({
      latitude: fix.coordinates.latitude,
      longitude: fix.coordinates.longitude,
      accuracyMeters: fix.accuracyMeters,
      speedMps: fix.speedMps,
      recordedAt: now,
    })
    trailRef.current = motionEngineRef.current.getSnapshot().trail
    trailListenersRef.current.notify()
  }, [gpsFeed, publishMetrics])

  useEffect(() => {
    if (gpsRecordingEnabled && !wasRecordingGpsRef.current) {
      motionEngineRef.current.reset()
      displaySpeedTrackerRef.current.reset()
      lastIngestedAtRef.current = null
      trailRef.current = []
      displaySpeedRef.current = 0
      syncMotionMetrics()
      publishMetrics({ displaySpeedKmh: 0 })
    }
    wasRecordingGpsRef.current = gpsRecordingEnabled
  }, [gpsRecordingEnabled, publishMetrics, syncMotionMetrics])

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
    displaySpeedTrackerRef.current.reset()
    trailRef.current = []
    displaySpeedRef.current = 0
    setMetrics({
      elapsedSeconds: 0,
      distanceKm: 0,
      currentSpeedKmh: 0,
      displaySpeedKmh: 0,
      averageSpeedKmh: 0,
      trail: [],
    })
    setIsFinished(false)
    setIsPaused(false)
    setFrozenSnapshot(null)
    pausedElapsedRef.current = 0
  }, [enabled, modality, durationMinutes])

  useEffect(() => {
    if (!isTracking) return

    const timer = setInterval(() => {
      elapsedSecondsRef.current = Math.floor((Date.now() - startedAtRef.current) / 1000)
    }, METRICS_UI_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [isTracking])

  useEffect(() => {
    if (!isTracking) return

    const timer = setInterval(() => {
      syncMotionMetrics()
    }, METRICS_UI_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [isTracking, syncMotionMetrics])

  useEffect(() => {
    if (!isTracking) return

    const timer = setInterval(() => {
      publishMetrics({
        displaySpeedKmh: displaySpeedRef.current,
        elapsedSeconds: elapsedSecondsRef.current,
      })
    }, DISPLAY_SPEED_UI_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [isTracking, publishMetrics])

  useEffect(() => {
    if (!gpsFeed || !isTracking) return

    return gpsFeed.subscribePosition(() => {
      ingestGpsFix()
    })
  }, [gpsFeed, ingestGpsFix, isTracking])

  useEffect(() => {
    if (!isPaused || isFinished) return
    displaySpeedTrackerRef.current.reset()
    displaySpeedRef.current = 0
    publishMetrics({ displaySpeedKmh: 0 })
  }, [isFinished, isPaused, publishMetrics])

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
      displaySpeedKmh: displaySpeedRef.current,
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

  const mapTrailFeed = useMemo<RunWalkLiveMapTrailFeed>(
    () => ({
      subscribeTrail: (listener) => trailListenersRef.current.subscribe(listener),
      getTrail: () =>
        trailRef.current.map((point) => ({
          latitude: point.latitude,
          longitude: point.longitude,
        })),
      getDisplaySpeedKmh: () => displaySpeedRef.current,
    }),
    [],
  )

  const activeElapsedSeconds = frozenSnapshot?.elapsedSeconds ?? metrics.elapsedSeconds
  const activeDistanceKm = frozenSnapshot?.distanceKm ?? metrics.distanceKm
  const activeAverageSpeedKmh = frozenSnapshot?.averageSpeedKmh ?? metrics.averageSpeedKmh
  const activeSpeedKmh = frozenSnapshot?.currentSpeedKmh ?? metrics.currentSpeedKmh
  const activeDisplaySpeedKmh = frozenSnapshot?.displaySpeedKmh ?? metrics.displaySpeedKmh
  const activeTrail = frozenSnapshot?.trail ?? metrics.trail
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
    currentPaceMinPerKm: metrics.distanceKm > 0 ? null : getFallbackPaceMinPerKm(modality),
    currentSpeedKmh: activeSpeedKmh,
    displaySpeedKmh: activeDisplaySpeedKmh,
    averageSpeedKmh: activeAverageSpeedKmh,
    stepCount,
    heartRateBpm,
    trail: activeTrail,
    mapTrailFeed,
    currentStep,
    activitySteps,
    isFinished,
    isPaused,
    isGpsRecording: gpsRecordingEnabled,
    finishActivity,
    pauseActivity,
    resumeActivity,
    togglePauseActivity,
  }
}

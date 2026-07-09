import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LIVE_SHARE_MIN_PUBLISH_GAP_MS,
  LIVE_SHARE_PUBLISH_INTERVAL_MS,
} from '../constants/runWalkLiveShare'
import {
  appendLiveSharePoint,
  clearActiveLiveShareSession,
  createLiveShareSession,
  endLiveShareSession,
  isRemoteLiveShareSession,
  loadActiveLiveShareSession,
  shouldReplaceLiveShareSession,
} from '../data/runWalkLiveShareService'
import { useRunWalkOfflineGpsQueue } from './useRunWalkOfflineGpsQueue'
import { useRunWalkLocation } from './useRunWalkLocation'
import type { RegistrationAddress } from '../types/auth'
import type { LiveShareSessionSnapshot } from '../types/runWalkLiveShare'

type UseRunWalkLiveSharePublisherOptions = {
  enabled: boolean
  address?: RegistrationAddress
  participantName: string
  participantPhotoUrl?: string | null
  activityName: string
}

export function useRunWalkLiveSharePublisher({
  enabled,
  address,
  participantName,
  participantPhotoUrl,
  activityName,
}: UseRunWalkLiveSharePublisherOptions) {
  const location = useRunWalkLocation({
    address,
    enabled,
    trackHeading: enabled,
    trackingMode: enabled ? 'activity' : 'default',
    positionUpdateMode: enabled ? 'ref' : 'state',
  })
  const [session, setSession] = useState<LiveShareSessionSnapshot | null>(null)
  const [shouldPublish, setShouldPublish] = useState(false)
  const lastPublishedAtRef = useRef<number>(0)
  const sessionRef = useRef<LiveShareSessionSnapshot | null>(null)
  const shouldPublishRef = useRef(false)

  const {
    isOffline,
    isSyncing,
    pendingCount,
    queueGpsPoint,
    flushQueue,
  } = useRunWalkOfflineGpsQueue({
    enabled,
    sessionId: session?.id,
    shouldPublish,
  })

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    shouldPublishRef.current = shouldPublish
  }, [shouldPublish])

  const activateSharing = useCallback(async (): Promise<LiveShareSessionSnapshot | null> => {
    if (!enabled) return null

    let activeSession = await loadActiveLiveShareSession()

    if (await shouldReplaceLiveShareSession(activeSession)) {
      const fix = location.getGpsFix()
      if (!fix) return null

      activeSession = await createLiveShareSession({
        participantName,
        participantPhotoUrl,
        activityName,
        latitude: fix.coordinates.latitude,
        longitude: fix.coordinates.longitude,
        accuracyMeters: fix.accuracyMeters,
      })
    }

    if (!activeSession?.isActive) return null

    setSession(activeSession)
    setShouldPublish(true)
    return activeSession
  }, [activityName, enabled, location.getGpsFix, participantName, participantPhotoUrl])

  useEffect(() => {
    if (!enabled) return

    let active = true

    async function bootstrap() {
      const saved = await loadActiveLiveShareSession()

      if (!active) return

      if (saved?.isActive && (await shouldReplaceLiveShareSession(saved))) {
        await clearActiveLiveShareSession()
        return
      }

      if (saved?.isActive) {
        setShouldPublish(true)
        setSession(saved)
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || !shouldPublish || session?.isActive) return

    let cancelled = false

    void (async () => {
      const fix = location.getGpsFix()
      if (!fix) return

      const created = await createLiveShareSession({
        participantName,
        participantPhotoUrl,
        activityName,
        latitude: fix.coordinates.latitude,
        longitude: fix.coordinates.longitude,
        accuracyMeters: fix.accuracyMeters,
      })

      if (!cancelled) {
        setSession(created)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    activityName,
    enabled,
    location.getGpsFix,
    participantName,
    participantPhotoUrl,
    session?.isActive,
    shouldPublish,
  ])

  const publishCurrentLocation = useCallback(async () => {
    if (!enabled || !shouldPublishRef.current || !sessionRef.current?.isActive) {
      return
    }

    const fix = location.getGpsFix()
    if (!fix) return

    const now = Date.now()
    if (now - lastPublishedAtRef.current < LIVE_SHARE_MIN_PUBLISH_GAP_MS) return

    const activeSession = sessionRef.current
    const pointInput = {
      sessionId: activeSession.id,
      latitude: fix.coordinates.latitude,
      longitude: fix.coordinates.longitude,
      accuracyMeters: fix.accuracyMeters,
    }

    if (isOffline && isRemoteLiveShareSession(activeSession.id)) {
      await queueGpsPoint(pointInput)
      return
    }

    const point = await appendLiveSharePoint(pointInput)

    if (!point && isRemoteLiveShareSession(activeSession.id)) {
      await queueGpsPoint(pointInput)
      return
    }

    if (!point) return

    lastPublishedAtRef.current = now
    setSession((current) =>
      current
        ? {
            ...current,
            points: [...current.points, point],
          }
        : current,
    )
  }, [enabled, isOffline, location.getGpsFix, queueGpsPoint])

  useEffect(() => {
    if (!enabled || !shouldPublish || !session?.isActive) return

    void publishCurrentLocation()

    const timer = setInterval(() => {
      void publishCurrentLocation()
    }, LIVE_SHARE_PUBLISH_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [enabled, publishCurrentLocation, session?.id, session?.isActive, shouldPublish])

  const endActiveLiveShareSession = useCallback(async () => {
    let activeSession = sessionRef.current
    if (!activeSession?.isActive) {
      activeSession = await loadActiveLiveShareSession()
    }
    if (!activeSession?.isActive) return

    if (isRemoteLiveShareSession(activeSession.id)) {
      await flushQueue()
    }

    await endLiveShareSession(activeSession.id)
    setSession(null)
    setShouldPublish(false)
  }, [flushQueue])

  return {
    session,
    setSession,
    location,
    activateSharing,
    publishCurrentLocation,
    publishIntervalMs: LIVE_SHARE_PUBLISH_INTERVAL_MS,
    endActiveLiveShareSession,
    isOffline,
    isSyncing,
    pendingSyncCount: pendingCount,
    flushQueuedPoints: flushQueue,
  }
}

export { LIVE_SHARE_PUBLISH_INTERVAL_MS }

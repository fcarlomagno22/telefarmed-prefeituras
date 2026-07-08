import { useCallback, useEffect, useRef, useState } from 'react'
import {
  appendLiveSharePoint,
  createLiveShareSession,
  clearActiveLiveShareSession,
  endLiveShareSession,
  loadActiveLiveShareSession,
  shouldReplaceLiveShareSession,
} from '../data/runWalkLiveShareService'
import { enqueueRunWalkGpsPoint, loadRunWalkGpsQueue, removeRunWalkGpsPoints } from '../data/runWalkGpsPointQueue'
import { useAppNetwork } from './useAppNetwork'
import { useRunWalkLocation } from './useRunWalkLocation'
import type { RegistrationAddress } from '../types/auth'
import type { LiveShareSessionSnapshot } from '../types/runWalkLiveShare'

const PUBLISH_INTERVAL_MS = 30 * 1000
const MIN_PUBLISH_GAP_MS = 10_000

type UseRunWalkLiveSharePublisherOptions = {
  enabled: boolean
  address?: RegistrationAddress
  participantName: string
  activityName: string
}

export function useRunWalkLiveSharePublisher({
  enabled,
  address,
  participantName,
  activityName,
}: UseRunWalkLiveSharePublisherOptions) {
  const location = useRunWalkLocation({
    address,
    enabled,
    trackHeading: enabled,
    trackingMode: enabled ? 'activity' : 'default',
    positionUpdateMode: enabled ? 'ref' : 'state',
  })
  const { isConnected } = useAppNetwork()
  const [session, setSession] = useState<LiveShareSessionSnapshot | null>(null)
  const [shouldPublish, setShouldPublish] = useState(false)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const lastPublishedAtRef = useRef<number>(0)
  const sessionRef = useRef<LiveShareSessionSnapshot | null>(null)
  const shouldPublishRef = useRef(false)
  const isSyncingRef = useRef(false)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    shouldPublishRef.current = shouldPublish
  }, [shouldPublish])

  const refreshPendingSyncCount = useCallback(async () => {
    const queue = await loadRunWalkGpsQueue()
    setPendingSyncCount(queue.length)
  }, [])

  const flushQueuedPoints = useCallback(async () => {
    if (!enabled || !isConnected || isSyncingRef.current) return

    const queue = await loadRunWalkGpsQueue()
    if (queue.length === 0) {
      setPendingSyncCount(0)
      return
    }

    isSyncingRef.current = true
    setIsSyncing(true)

    const syncedIds: string[] = []

    try {
      for (const point of queue) {
        const synced = await appendLiveSharePoint({
          sessionId: point.sessionId,
          latitude: point.latitude,
          longitude: point.longitude,
          accuracyMeters: point.accuracyMeters,
        })
        if (!synced) break
        syncedIds.push(point.id)
      }

      if (syncedIds.length > 0) {
        await removeRunWalkGpsPoints(syncedIds)
      }
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
      await refreshPendingSyncCount()
    }
  }, [enabled, isConnected, refreshPendingSyncCount])

  useEffect(() => {
    void refreshPendingSyncCount()
  }, [refreshPendingSyncCount])

  useEffect(() => {
    if (!enabled || !isConnected) return
    void flushQueuedPoints()
  }, [enabled, flushQueuedPoints, isConnected])

  const activateSharing = useCallback(async (): Promise<LiveShareSessionSnapshot | null> => {
    if (!enabled) return null

    let activeSession = await loadActiveLiveShareSession()

    if (shouldReplaceLiveShareSession(activeSession)) {
      const fix = location.getGpsFix()
      if (!fix) return null

      activeSession = await createLiveShareSession({
        participantName,
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
  }, [activityName, enabled, location.getGpsFix, participantName])

  useEffect(() => {
    if (!enabled) return

    let active = true

    async function bootstrap() {
      const saved = await loadActiveLiveShareSession()

      if (!active) return

      if (saved?.isActive && shouldReplaceLiveShareSession(saved)) {
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
    if (now - lastPublishedAtRef.current < MIN_PUBLISH_GAP_MS) return

    const activeSession = sessionRef.current
    const pointInput = {
      sessionId: activeSession.id,
      latitude: fix.coordinates.latitude,
      longitude: fix.coordinates.longitude,
      accuracyMeters: fix.accuracyMeters,
    }

    const isRemoteSession = !activeSession.id.startsWith('local-')

    if (!isConnected && isRemoteSession) {
      await enqueueRunWalkGpsPoint({
        ...pointInput,
        recordedAt: new Date().toISOString(),
      })
      await refreshPendingSyncCount()
      return
    }

    const point = await appendLiveSharePoint(pointInput)

    if (!point && isRemoteSession) {
      await enqueueRunWalkGpsPoint({
        ...pointInput,
        recordedAt: new Date().toISOString(),
      })
      await refreshPendingSyncCount()
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
  }, [enabled, isConnected, location.getGpsFix, refreshPendingSyncCount])

  useEffect(() => {
    if (!enabled || !shouldPublish || !session?.isActive) return

    void publishCurrentLocation()

    const timer = setInterval(() => {
      void publishCurrentLocation()
    }, PUBLISH_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [enabled, publishCurrentLocation, session?.id, session?.isActive, shouldPublish])

  const endActiveLiveShareSession = useCallback(async () => {
    const activeSession = sessionRef.current
    if (!activeSession?.isActive) return
    await endLiveShareSession(activeSession.id)
    setSession(null)
    setShouldPublish(false)
  }, [])

  return {
    session,
    setSession,
    location,
    activateSharing,
    publishCurrentLocation,
    publishIntervalMs: PUBLISH_INTERVAL_MS,
    endActiveLiveShareSession,
    isOffline: !isConnected,
    isSyncing,
    pendingSyncCount,
    flushQueuedPoints,
  }
}

export { PUBLISH_INTERVAL_MS as LIVE_SHARE_PUBLISH_INTERVAL_MS }

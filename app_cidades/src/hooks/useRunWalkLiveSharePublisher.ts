import { useCallback, useEffect, useRef, useState } from 'react'
import {
  appendLiveSharePoint,
  createLiveShareSession,
  clearActiveLiveShareSession,
  endLiveShareSession,
  loadActiveLiveShareSession,
  shouldReplaceLiveShareSession,
} from '../data/runWalkLiveShareService'
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
  })
  const [session, setSession] = useState<LiveShareSessionSnapshot | null>(null)
  const [shouldPublish, setShouldPublish] = useState(false)
  const lastPublishedAtRef = useRef<number>(0)
  const sessionRef = useRef<LiveShareSessionSnapshot | null>(null)
  const shouldPublishRef = useRef(false)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    shouldPublishRef.current = shouldPublish
  }, [shouldPublish])

  const activateSharing = useCallback(async (): Promise<LiveShareSessionSnapshot | null> => {
    if (!enabled) return null

    let activeSession = await loadActiveLiveShareSession()

    if (shouldReplaceLiveShareSession(activeSession) && location.coordinates) {
      activeSession = await createLiveShareSession({
        participantName,
        activityName,
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
        accuracyMeters: location.accuracyMeters,
      })
    }

    if (!activeSession?.isActive) return null

    setSession(activeSession)
    setShouldPublish(true)
    return activeSession
  }, [
    activityName,
    enabled,
    location.accuracyMeters,
    location.coordinates,
    participantName,
  ])

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
    if (!enabled || !shouldPublish || session?.isActive || !location.coordinates) return

    let cancelled = false

    void createLiveShareSession({
      participantName,
      activityName,
      latitude: location.coordinates.latitude,
      longitude: location.coordinates.longitude,
      accuracyMeters: location.accuracyMeters,
    }).then((created) => {
      if (!cancelled) {
        setSession(created)
      }
    })

    return () => {
      cancelled = true
    }
  }, [
    activityName,
    enabled,
    location.accuracyMeters,
    location.coordinates,
    participantName,
    session?.isActive,
    shouldPublish,
  ])

  const publishCurrentLocation = useCallback(async () => {
    if (!enabled || !shouldPublishRef.current || !sessionRef.current?.isActive || !location.coordinates) {
      return
    }

    const now = Date.now()
    if (now - lastPublishedAtRef.current < MIN_PUBLISH_GAP_MS) return

    const activeSession = sessionRef.current
    const point = await appendLiveSharePoint({
      sessionId: activeSession.id,
      latitude: location.coordinates.latitude,
      longitude: location.coordinates.longitude,
      accuracyMeters: location.accuracyMeters,
    })

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
  }, [enabled, location.accuracyMeters, location.coordinates])

  useEffect(() => {
    if (!enabled || !shouldPublish || !session?.isActive || !location.coordinates) return

    void publishCurrentLocation()

    const timer = setInterval(() => {
      void publishCurrentLocation()
    }, PUBLISH_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [
    enabled,
    location.coordinates,
    publishCurrentLocation,
    session?.id,
    session?.isActive,
    shouldPublish,
  ])

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
  }
}

export { PUBLISH_INTERVAL_MS as LIVE_SHARE_PUBLISH_INTERVAL_MS }

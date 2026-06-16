import { useCallback, useEffect, useRef, useState } from 'react'
import {
  appendLiveSharePoint,
  createLiveShareSession,
  endLiveShareSession,
  loadActiveLiveShareSession,
} from '../data/runWalkLiveShareService'
import { useRunWalkLocation } from './useRunWalkLocation'
import type { RegistrationAddress } from '../types/auth'
import type { LiveShareSessionSnapshot } from '../types/runWalkLiveShare'

const PUBLISH_INTERVAL_MS = 2 * 60 * 1000

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
  const location = useRunWalkLocation({ address, enabled })
  const [session, setSession] = useState<LiveShareSessionSnapshot | null>(null)
  const [shouldPublish, setShouldPublish] = useState(false)
  const lastPublishedAtRef = useRef<number>(0)
  const sessionRef = useRef<LiveShareSessionSnapshot | null>(null)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    if (!enabled) return

    let active = true

    async function bootstrap() {
      const saved = await loadActiveLiveShareSession()

      if (!active) return

      setShouldPublish(Boolean(saved?.isActive))

      if (saved?.isActive) {
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
    if (!enabled || !shouldPublish || !session?.isActive || !location.coordinates) return

    const now = Date.now()
    if (now - lastPublishedAtRef.current < 15_000) return

    const point = await appendLiveSharePoint({
      sessionId: session.id,
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
  }, [enabled, location.accuracyMeters, location.coordinates, session, shouldPublish])

  useEffect(() => {
    if (!enabled || !session?.isActive || !location.coordinates) return

    void publishCurrentLocation()

    const timer = setInterval(() => {
      void publishCurrentLocation()
    }, PUBLISH_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [enabled, location.coordinates, publishCurrentLocation, session?.id, session?.isActive])

  useEffect(() => {
    return () => {
      const activeSession = sessionRef.current
      if (activeSession?.isActive) {
        void endLiveShareSession(activeSession.id)
      }
    }
  }, [])

  return {
    session,
    setSession,
    location,
    publishCurrentLocation,
    publishIntervalMs: PUBLISH_INTERVAL_MS,
  }
}

export { PUBLISH_INTERVAL_MS as LIVE_SHARE_PUBLISH_INTERVAL_MS }

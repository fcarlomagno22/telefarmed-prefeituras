import { useCallback, useEffect, useRef } from 'react'
import {
  resolveLiveMapHeading,
  smoothMapHeading,
} from '../../../utils/mapHeadingSmoothing'
import type { RunWalkLiveGpsFeed, RunWalkLiveMapTrailFeed } from '../../../hooks/runWalkLiveGpsFeed'
import { buildTrailSignature } from './runWalkActivityTrailMapShared'

type UseRunWalkLiveMapFeedSyncOptions = {
  enabled: boolean
  liveGpsFeed?: RunWalkLiveGpsFeed | null
  mapTrailFeed?: RunWalkLiveMapTrailFeed | null
  rotateWithHeading: boolean
  followUser: boolean
  onUpdate: (payload: {
    trail: ReturnType<RunWalkLiveMapTrailFeed['getTrail']>
    currentPosition: { latitude: number; longitude: number } | null
    heading: number | null
    displaySpeedKmh: number
    trailChanged: boolean
  }) => void
}

export function useRunWalkLiveMapFeedSync({
  enabled,
  liveGpsFeed,
  mapTrailFeed,
  rotateWithHeading,
  followUser,
  onUpdate,
}: UseRunWalkLiveMapFeedSyncOptions) {
  const onUpdateRef = useRef(onUpdate)
  const smoothedHeadingRef = useRef<number | null>(null)
  const lastTrailSignatureRef = useRef('')

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  const pushLiveUpdate = useCallback(() => {
    if (!liveGpsFeed || !mapTrailFeed) return

    const fix = liveGpsFeed.getGpsFix()
    if (!fix) return

    const trail = mapTrailFeed.getTrail()
    const trailSignature = buildTrailSignature(trail)
    const trailChanged = trailSignature !== lastTrailSignatureRef.current
    if (trailChanged) {
      lastTrailSignatureRef.current = trailSignature
    }

    const targetHeading = rotateWithHeading
      ? resolveLiveMapHeading(
          trail,
          fix.headingDegrees,
          smoothedHeadingRef.current,
          mapTrailFeed.getDisplaySpeedKmh(),
        )
      : null
    const heading =
      rotateWithHeading && followUser
        ? smoothMapHeading(smoothedHeadingRef.current, targetHeading)
        : null

    if (heading != null) {
      smoothedHeadingRef.current = heading
    } else if (!rotateWithHeading) {
      smoothedHeadingRef.current = null
    }

    onUpdateRef.current({
      trail,
      currentPosition: fix.coordinates,
      heading,
      displaySpeedKmh: mapTrailFeed.getDisplaySpeedKmh(),
      trailChanged,
    })
  }, [followUser, liveGpsFeed, mapTrailFeed, rotateWithHeading])

  useEffect(() => {
    if (!enabled || !liveGpsFeed || !mapTrailFeed) return

    lastTrailSignatureRef.current = ''
    pushLiveUpdate()

    const unsubscribePosition = liveGpsFeed.subscribePosition(pushLiveUpdate)
    const unsubscribeTrail = mapTrailFeed.subscribeTrail(pushLiveUpdate)

    return () => {
      unsubscribePosition()
      unsubscribeTrail()
    }
  }, [enabled, liveGpsFeed, mapTrailFeed, pushLiveUpdate])

  return { resetTrailSignature: () => {
    lastTrailSignatureRef.current = ''
  } }
}

import { useCallback, useEffect, useRef, useState, type ComponentRef, type RefObject } from 'react'
import MapView from 'react-native-maps'
import type { GeoCoordinates } from '../../../utils/geo'
import { haversineDistanceKm } from '../../../utils/geo'

export type RunWalkNativeMapFrame = {
  markerPosition: GeoCoordinates | null
  liveSegment: GeoCoordinates[]
  heading: number | null
  committedTrail: GeoCoordinates[]
}

type FrameHandle = number

const GPS_INTERPOLATION_MS = 300
const CAMERA_FOLLOW_FACTOR = 0.65
const CAMERA_SNAP_DISTANCE_M = 5
const LIVE_SEGMENT_MIN_DISTANCE_M = 0.5

const scheduleFrame: (callback: FrameRequestCallback) => FrameHandle =
  typeof globalThis.requestAnimationFrame === 'function'
    ? globalThis.requestAnimationFrame.bind(globalThis)
    : (callback) => setTimeout(() => callback(Date.now()), 16) as unknown as FrameHandle

const cancelFrame: (handle: FrameHandle) => void =
  typeof globalThis.cancelAnimationFrame === 'function'
    ? globalThis.cancelAnimationFrame.bind(globalThis)
    : (handle) => {
        clearTimeout(handle)
      }

function lerpCoordinate(from: GeoCoordinates, to: GeoCoordinates, t: number): GeoCoordinates {
  const clamped = Math.max(0, Math.min(1, t))
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * clamped,
    longitude: from.longitude + (to.longitude - from.longitude) * clamped,
  }
}

function normalizeHeading(heading: number): number {
  return ((heading % 360) + 360) % 360
}

function shortestHeadingDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180
}

function lerpHeading(from: number | null, to: number | null, t: number): number | null {
  if (to == null) return from
  if (from == null) return normalizeHeading(to)

  const clamped = Math.max(0, Math.min(1, t))
  const delta = shortestHeadingDelta(from, to)
  return normalizeHeading(from + delta * clamped)
}

function buildLiveSegment(
  committedTrail: GeoCoordinates[],
  markerPosition: GeoCoordinates | null,
): GeoCoordinates[] {
  if (!markerPosition) return []

  const anchor =
    committedTrail.length > 0
      ? committedTrail[committedTrail.length - 1]
      : markerPosition

  const distanceM = haversineDistanceKm(anchor, markerPosition) * 1000
  if (distanceM < LIVE_SEGMENT_MIN_DISTANCE_M) return []

  return [anchor, markerPosition]
}

function updateCameraSmooth(
  mapRef: RefObject<ComponentRef<typeof MapView> | null>,
  cameraCenterRef: { current: GeoCoordinates | null },
  marker: GeoCoordinates,
  heading: number | null,
  rotateWithHeading: boolean,
  programmaticCameraRef: { current: boolean },
) {
  if (!mapRef.current) return

  let center = cameraCenterRef.current ?? marker
  const distanceM = haversineDistanceKm(center, marker) * 1000

  if (distanceM < CAMERA_SNAP_DISTANCE_M) {
    center = marker
  } else {
    center = {
      latitude: center.latitude + (marker.latitude - center.latitude) * CAMERA_FOLLOW_FACTOR,
      longitude: center.longitude + (marker.longitude - center.longitude) * CAMERA_FOLLOW_FACTOR,
    }
  }

  cameraCenterRef.current = center
  programmaticCameraRef.current = true

  mapRef.current.setCamera({
    center,
    heading:
      rotateWithHeading && heading != null && Number.isFinite(heading) ? heading : 0,
    pitch: 0,
  })

  scheduleFrame(() => {
    programmaticCameraRef.current = false
  })
}

type UseRunWalkNativeMapMotionOptions = {
  enabled: boolean
  isPaused: boolean
  followUser: boolean
  rotateWithHeading: boolean
  mapRef: RefObject<ComponentRef<typeof MapView> | null>
  initialTrail: GeoCoordinates[]
  initialPosition: GeoCoordinates | null
  programmaticCameraRef: { current: boolean }
}

export function useRunWalkNativeMapMotion({
  enabled,
  isPaused,
  followUser,
  rotateWithHeading,
  mapRef,
  initialTrail,
  initialPosition,
  programmaticCameraRef,
}: UseRunWalkNativeMapMotionOptions) {
  const followUserRef = useRef(followUser)
  const rotateWithHeadingRef = useRef(rotateWithHeading)
  const isPausedRef = useRef(isPaused)
  const rafHandleRef = useRef<FrameHandle | null>(null)

  const markerFromRef = useRef<GeoCoordinates | null>(initialPosition)
  const markerToRef = useRef<GeoCoordinates | null>(initialPosition)
  const displayedMarkerRef = useRef<GeoCoordinates | null>(initialPosition)
  const segmentStartMsRef = useRef(0)
  const segmentDurationMsRef = useRef(GPS_INTERPOLATION_MS)
  const headingFromRef = useRef<number | null>(null)
  const headingToRef = useRef<number | null>(null)
  const committedTrailRef = useRef<GeoCoordinates[]>(initialTrail)
  const cameraCenterRef = useRef<GeoCoordinates | null>(initialPosition)

  const [frame, setFrame] = useState<RunWalkNativeMapFrame>(() => ({
    markerPosition: initialPosition,
    liveSegment: buildLiveSegment(initialTrail, initialPosition),
    heading: null,
    committedTrail: initialTrail,
  }))

  useEffect(() => {
    followUserRef.current = followUser
  }, [followUser])

  useEffect(() => {
    rotateWithHeadingRef.current = rotateWithHeading
  }, [rotateWithHeading])

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  const setGpsTarget = useCallback(
    (payload: {
      trail: GeoCoordinates[]
      currentPosition: GeoCoordinates | null
      heading: number | null
      trailChanged: boolean
    }) => {
      if (!payload.currentPosition) return

      if (payload.trailChanged) {
        committedTrailRef.current = payload.trail
      }

      const now = performance.now()
      const displayed = displayedMarkerRef.current ?? payload.currentPosition

      markerFromRef.current = displayed
      markerToRef.current = payload.currentPosition
      segmentStartMsRef.current = now
      segmentDurationMsRef.current = GPS_INTERPOLATION_MS

      headingFromRef.current = headingToRef.current
      headingToRef.current = payload.heading

      if (displayedMarkerRef.current == null) {
        displayedMarkerRef.current = payload.currentPosition
        setFrame({
          markerPosition: payload.currentPosition,
          liveSegment: buildLiveSegment(committedTrailRef.current, payload.currentPosition),
          heading: payload.heading,
          committedTrail: committedTrailRef.current,
        })
      }
    },
    [],
  )

  const tick = useCallback(() => {
    rafHandleRef.current = scheduleFrame(tick)

    if (isPausedRef.current) return

    const from = markerFromRef.current
    const to = markerToRef.current
    if (!from || !to) return

    const now = performance.now()
    const duration = Math.max(1, segmentDurationMsRef.current)
    const elapsed = now - segmentStartMsRef.current
    const t = Math.min(1, elapsed / duration)

    const marker = lerpCoordinate(from, to, t)
    displayedMarkerRef.current = marker

    const heading = lerpHeading(headingFromRef.current, headingToRef.current, t)
    const liveSegment = buildLiveSegment(committedTrailRef.current, marker)

    setFrame({
      markerPosition: marker,
      liveSegment,
      heading,
      committedTrail: committedTrailRef.current,
    })

    if (followUserRef.current) {
      updateCameraSmooth(
        mapRef,
        cameraCenterRef,
        marker,
        heading,
        rotateWithHeadingRef.current,
        programmaticCameraRef,
      )
    }
  }, [mapRef, programmaticCameraRef])

  const stopLoop = useCallback(() => {
    if (rafHandleRef.current != null) {
      cancelFrame(rafHandleRef.current)
      rafHandleRef.current = null
    }
  }, [])

  const startLoop = useCallback(() => {
    if (rafHandleRef.current != null) return
    rafHandleRef.current = scheduleFrame(tick)
  }, [tick])

  useEffect(() => {
    if (!enabled) {
      stopLoop()
      return
    }

    if (isPaused) {
      stopLoop()
      return
    }

    startLoop()
    return stopLoop
  }, [enabled, isPaused, startLoop, stopLoop])

  useEffect(() => {
    if (!enabled || !followUser) return

    const marker = displayedMarkerRef.current
    if (!marker || !mapRef.current) return

    cameraCenterRef.current = marker
    programmaticCameraRef.current = true
    mapRef.current.setCamera({
      center: marker,
      heading:
        rotateWithHeadingRef.current &&
        headingToRef.current != null &&
        Number.isFinite(headingToRef.current)
          ? headingToRef.current
          : 0,
      pitch: 0,
    })

    scheduleFrame(() => {
      programmaticCameraRef.current = false
    })
  }, [enabled, followUser, mapRef, programmaticCameraRef])

  return {
    frame,
    setGpsTarget,
    resetCameraCenter: useCallback(() => {
      cameraCenterRef.current = displayedMarkerRef.current
    }, []),
  }
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { colors } from '../../../theme/colors'
import { StyleSheet, View } from 'react-native'
import {
  resolveLiveMapHeading,
  smoothMapHeading,
} from '../../../utils/mapHeadingSmoothing'
import { profilePhotoToDataUri } from '../../../utils/profilePhotoImage'
import {
  addTrailMapTileLayer,
  createLiveTrailMapController,
  createTrailLeafletMap,
  setupStaticTrailMap,
  type LiveTrailMapController,
} from './runWalkActivityTrailMapLeafletEngine'
import {
  buildTrailMapPinStyles,
  TRAIL_MAP_BASE_CSS,
  TRAIL_MAP_DEFAULT_CENTER,
  TRAIL_MAP_LEAFLET_CSS_URL,
  TRAIL_MAP_LEAFLET_JS_URL,
  TRAIL_MAP_LIVE_ZOOM,
  trailToLatLngPairs,
  type RunWalkActivityTrailMapProps,
} from './runWalkActivityTrailMapShared'

type LeafletNamespace = {
  map: (element: HTMLElement, options: Record<string, unknown>) => unknown
  tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: unknown) => void }
}

declare global {
  interface Window {
    L?: LeafletNamespace
  }
}

let mapAssetsPromise: Promise<LeafletNamespace> | null = null

function loadStylesheet(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve()
      return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.crossOrigin = ''
    link.onload = () => resolve()
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`))
    document.head.appendChild(link)
  })
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.crossOrigin = ''
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.body.appendChild(script)
  })
}

function injectCustomMapStyles(hasPhoto: boolean) {
  const styleId = 'running-trail-map-styles'
  let style = document.querySelector(`style[data-${styleId}]`) as HTMLStyleElement | null

  if (!style) {
    style = document.createElement('style')
    style.setAttribute(`data-${styleId}`, 'true')
    document.head.appendChild(style)
  }

  style.textContent = `${TRAIL_MAP_BASE_CSS}${buildTrailMapPinStyles(hasPhoto)}`
}

async function ensureLeaflet(): Promise<LeafletNamespace> {
  if (window.L) return window.L

  if (!mapAssetsPromise) {
    mapAssetsPromise = (async () => {
      await loadStylesheet(TRAIL_MAP_LEAFLET_CSS_URL)
      await loadScript(TRAIL_MAP_LEAFLET_JS_URL)

      if (!window.L) {
        throw new Error('Leaflet failed to initialize on web.')
      }

      return window.L
    })()
  }

  return mapAssetsPromise
}

export function RunWalkActivityTrailMap({
  trail,
  currentPosition = null,
  height = 180,
  fullscreen = false,
  interactive = false,
  liveTracking = false,
  followUser = true,
  onUserPanned,
  onMapInteractionChange,
  profilePhotoUri,
  deviceHeadingDegrees = null,
  currentSpeedKmh = 0,
  rotateWithHeading = false,
}: RunWalkActivityTrailMapProps) {
  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<{ remove: () => void } | null>(null)
  const liveControllerRef = useRef<LiveTrailMapController | null>(null)
  const staticControllerRef = useRef<{ destroy: () => void; invalidateSize: () => void } | null>(
    null,
  )
  const followUserRef = useRef(followUser)
  const currentPositionRef = useRef(currentPosition)
  const rotateWithHeadingRef = useRef(rotateWithHeading)
  const smoothedHeadingRef = useRef<number | null>(null)
  const lastInjectAtRef = useRef(0)
  const onUserPannedRef = useRef(onUserPanned)
  const onMapInteractionChangeRef = useRef(onMapInteractionChange)
  const [profilePhotoDataUri, setProfilePhotoDataUri] = useState<string | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  const mapOriginRef = useRef(
    currentPosition ?? trail[trail.length - 1] ?? TRAIL_MAP_DEFAULT_CENTER,
  )
  const initialCenter = mapOriginRef.current

  const staticTrailSignature = useMemo(
    () => trail.map((point) => `${point.latitude},${point.longitude}`).join('|'),
    [trail],
  )

  const mapMountSignature = liveTracking
    ? `live:${interactive}:${initialCenter.latitude}:${initialCenter.longitude}`
    : `static:${interactive}:${profilePhotoDataUri ?? ''}:${staticTrailSignature}`

  useEffect(() => {
    followUserRef.current = followUser
  }, [followUser])

  useEffect(() => {
    currentPositionRef.current = currentPosition
  }, [currentPosition])

  useEffect(() => {
    rotateWithHeadingRef.current = rotateWithHeading
  }, [rotateWithHeading])

  useEffect(() => {
    onUserPannedRef.current = onUserPanned
  }, [onUserPanned])

  useEffect(() => {
    onMapInteractionChangeRef.current = onMapInteractionChange
  }, [onMapInteractionChange])

  useEffect(() => {
    const trimmed = profilePhotoUri?.trim()
    if (!trimmed) {
      setProfilePhotoDataUri(null)
      return
    }

    let active = true
    void profilePhotoToDataUri(trimmed).then((dataUri) => {
      if (active) setProfilePhotoDataUri(dataUri)
    })

    return () => {
      active = false
    }
  }, [profilePhotoUri])

  const bindMapHostRef = (node: View | null) => {
    mapHostRef.current = node as unknown as HTMLDivElement | null
  }

  useEffect(() => {
    let disposed = false

    async function renderMap() {
      const L = await ensureLeaflet()
      if (disposed) return

      const host = mapHostRef.current
      if (!host) return

      liveControllerRef.current?.destroy()
      liveControllerRef.current = null
      staticControllerRef.current?.destroy()
      staticControllerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
      setIsMapReady(false)

      injectCustomMapStyles(liveTracking ? false : Boolean(profilePhotoDataUri))

      const map = createTrailLeafletMap(L, host, { interactive, liveTracking })
      addTrailMapTileLayer(L, map)

      if (liveTracking) {
        map.setView([initialCenter.latitude, initialCenter.longitude], TRAIL_MAP_LIVE_ZOOM)
        liveControllerRef.current = createLiveTrailMapController({
          L,
          map,
          initialLatitude: initialCenter.latitude,
          initialLongitude: initialCenter.longitude,
          interactive: interactive || liveTracking,
          pinSize: 30,
          pinAnchor: 15,
          liveZoom: TRAIL_MAP_LIVE_ZOOM,
          callbacks: {
            onUserPanned: () => onUserPannedRef.current?.(),
          },
        })

        map.whenReady(() => {
          if (disposed) return
          liveControllerRef.current?.invalidateSize()
          setIsMapReady(true)
        })
      } else {
        staticControllerRef.current = setupStaticTrailMap({
          L,
          map,
          trail: trailToLatLngPairs(trail),
          profilePhotoDataUri,
          interactive,
          onMapInteractionChange: (active) => onMapInteractionChangeRef.current?.(active),
        })

        map.whenReady(() => {
          if (disposed) return
          staticControllerRef.current?.invalidateSize()
        })
      }

      mapRef.current = map
    }

    void renderMap()

    return () => {
      disposed = true
      liveControllerRef.current?.destroy()
      liveControllerRef.current = null
      staticControllerRef.current?.destroy()
      staticControllerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
      setIsMapReady(false)
    }
  }, [liveTracking, mapMountSignature, profilePhotoDataUri, trail])

  const injectLiveUpdate = useCallback(
    (force = false) => {
      const controller = liveControllerRef.current
      if (!controller) return

      const now = Date.now()
      if (!force && now - lastInjectAtRef.current < 100) return
      lastInjectAtRef.current = now

      const targetHeading = rotateWithHeadingRef.current
        ? resolveLiveMapHeading(
            trail,
            deviceHeadingDegrees,
            smoothedHeadingRef.current,
            currentSpeedKmh,
          )
        : null
      const heading =
        rotateWithHeadingRef.current && followUserRef.current
          ? smoothMapHeading(smoothedHeadingRef.current, targetHeading)
          : null
      if (heading != null) {
        smoothedHeadingRef.current = heading
      } else if (!rotateWithHeadingRef.current) {
        smoothedHeadingRef.current = null
      }

      controller.updateLiveTrailMap(
        trailToLatLngPairs(trail),
        heading,
        currentPosition?.latitude ?? null,
        currentPosition?.longitude ?? null,
      )
    },
    [currentPosition, currentSpeedKmh, deviceHeadingDegrees, trail],
  )

  useEffect(() => {
    if (!liveTracking || !isMapReady) return
    injectLiveUpdate(true)
  }, [injectLiveUpdate, isMapReady, liveTracking, trail, currentPosition])

  useEffect(() => {
    const controller = liveControllerRef.current
    if (!isMapReady || !controller || !liveTracking) return

    if (followUser) {
      const position = currentPositionRef.current
      controller.recenterOnUser(position?.latitude ?? null, position?.longitude ?? null)
      return
    }

    controller.setFollowUser(false)
  }, [followUser, isMapReady, liveTracking])

  useEffect(() => {
    const controller = liveControllerRef.current
    if (!isMapReady || !controller || !liveTracking) return
    controller.updatePinPhoto(profilePhotoDataUri)
  }, [isMapReady, liveTracking, profilePhotoDataUri])

  return (
    <View style={[styles.wrap, fullscreen ? styles.wrapFullscreen : { height }]}>
      <View ref={bindMapHostRef} style={styles.mapHost} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.18)',
    backgroundColor: colors.background,
  },
  wrapFullscreen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    borderWidth: 0,
  },
  mapHost: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
})

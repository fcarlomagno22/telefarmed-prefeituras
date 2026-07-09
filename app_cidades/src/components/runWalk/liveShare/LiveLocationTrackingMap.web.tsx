import { useEffect, useRef, useState } from 'react'
import { colors } from '../../../theme/colors'
import { StyleSheet, View } from 'react-native'
import {
  addLiveShareTrackingTileLayer,
  createLiveShareTrackingLeafletMap,
  createLiveShareTrackingMapController,
  type LiveShareTrackingMapController,
} from './liveLocationTrackingMapLeafletEngine'
import {
  buildLiveShareMapParticipantPinHtml,
  getLiveShareMapInitialView,
  LIVE_SHARE_MAP_CUSTOM_CSS,
  LIVE_SHARE_MAP_LEAFLET_CSS_URL,
  LIVE_SHARE_MAP_LEAFLET_JS_URL,
  liveSharePointsToTrail,
  type LiveLocationTrackingMapProps,
} from './liveLocationTrackingMapShared'

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

function injectCustomMapStyles() {
  const styleId = 'live-share-tracking-map-styles'
  if (document.querySelector(`style[data-${styleId}]`)) return

  const style = document.createElement('style')
  style.setAttribute(`data-${styleId}`, 'true')
  style.textContent = LIVE_SHARE_MAP_CUSTOM_CSS
  document.head.appendChild(style)
}

async function ensureLeaflet(): Promise<LeafletNamespace> {
  if (window.L) return window.L

  if (!mapAssetsPromise) {
    mapAssetsPromise = (async () => {
      await loadStylesheet(LIVE_SHARE_MAP_LEAFLET_CSS_URL)
      injectCustomMapStyles()
      await loadScript(LIVE_SHARE_MAP_LEAFLET_JS_URL)

      if (!window.L) {
        throw new Error('Leaflet failed to initialize on web.')
      }

      return window.L
    })()
  }

  return mapAssetsPromise
}

export function LiveLocationTrackingMap({
  points,
  participantLabel: _participantLabel,
  participantName,
  participantPhotoUrl,
  activityLabel: _activityLabel,
  fullscreen = false,
  bottomInsetPx = 220,
  topInsetPx = 56,
}: LiveLocationTrackingMapProps) {
  const participantPinHtml = buildLiveShareMapParticipantPinHtml(
    participantName,
    participantPhotoUrl,
  )
  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<{ remove: () => void } | null>(null)
  const controllerRef = useRef<LiveShareTrackingMapController | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

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

      controllerRef.current?.destroy()
      controllerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
      setIsMapReady(false)

      const { centerLat, centerLng, zoom } = getLiveShareMapInitialView(points)
      const map = createLiveShareTrackingLeafletMap(L, host)
      addLiveShareTrackingTileLayer(L, map)
      map.setView([centerLat, centerLng], zoom)

      controllerRef.current = createLiveShareTrackingMapController({
        L,
        map,
        initialTrail: liveSharePointsToTrail(points),
        participantPinHtml,
        bottomInsetPx,
        topInsetPx,
        callbacks: {
          onMapReady: () => {
            if (!disposed) setIsMapReady(true)
          },
        },
      })

      mapRef.current = map
    }

    void renderMap()

    return () => {
      disposed = true
      controllerRef.current?.destroy()
      controllerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
      setIsMapReady(false)
    }
  }, [participantPinHtml])

  useEffect(() => {
    const controller = controllerRef.current
    if (!controller || !isMapReady) return
    controller.updateLiveShareMap(
      liveSharePointsToTrail(points),
      bottomInsetPx,
      topInsetPx,
    )
  }, [bottomInsetPx, isMapReady, points, topInsetPx])

  return (
    <View style={[styles.wrap, fullscreen && styles.wrapFullscreen]}>
      <View ref={bindMapHostRef} style={styles.mapHost} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 280,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.18)',
    backgroundColor: colors.background,
  },
  wrapFullscreen: {
    minHeight: undefined,
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

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import type { LiveSharePoint } from '../../types/runWalkLiveSharePublic'
import { buildLiveShareMapMarkerHtml } from './LiveShareParticipantPhoto'

export type LiveShareTrackingMapHandle = {
  centerOnParticipant: () => void
}

type LeafletMap = {
  remove: () => void
  setView: (center: [number, number], zoom: number, options?: { animate?: boolean }) => void
  flyTo: (center: [number, number], zoom: number, options?: { duration?: number }) => void
  panBy: (offset: [number, number], options?: { animate?: boolean; duration?: number }) => void
  on: (event: string, handler: () => void) => void
  once: (event: string, handler: () => void) => void
  invalidateSize: () => void
}

type LeafletLayerGroup = {
  clearLayers: () => void
  addTo: (map: LeafletMap) => LeafletLayerGroup
}

type LeafletModule = {
  map: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMap
  tileLayer: (url: string, options?: Record<string, unknown>) => { addTo: (map: LeafletMap) => void }
  polyline: (
    latlngs: Array<[number, number]>,
    options?: Record<string, unknown>,
  ) => { addTo: (group: LeafletLayerGroup) => void }
  divIcon: (options?: Record<string, unknown>) => unknown
  marker: (
    latlng: [number, number],
    options?: Record<string, unknown>,
  ) => { addTo: (group: LeafletLayerGroup) => void }
  layerGroup: () => LeafletLayerGroup
}

declare global {
  interface Window {
    L?: LeafletModule
  }
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
const FOCUS_ZOOM = 16
const DEFAULT_BOTTOM_INSET = 220
const DEFAULT_TOP_INSET = 56

let leafletAssetsPromise: Promise<LeafletModule> | null = null

function loadLeafletAssets(): Promise<LeafletModule> {
  if (window.L) return Promise.resolve(window.L)
  if (leafletAssetsPromise) return leafletAssetsPromise

  leafletAssetsPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = LEAFLET_CSS
      document.head.appendChild(link)
    }

    const existingScript = document.querySelector(`script[src="${LEAFLET_JS}"]`) as
      | HTMLScriptElement
      | null

    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.L) resolve(window.L)
        else reject(new Error('Leaflet indisponível.'))
      })
      existingScript.addEventListener('error', () => reject(new Error('Leaflet indisponível.')))
      return
    }

    const script = document.createElement('script')
    script.src = LEAFLET_JS
    script.async = true
    script.onload = () => {
      if (window.L) resolve(window.L)
      else reject(new Error('Leaflet indisponível.'))
    }
    script.onerror = () => reject(new Error('Leaflet indisponível.'))
    document.body.appendChild(script)
  })

  return leafletAssetsPromise
}

function toLatLngs(points: LiveSharePoint[]): Array<[number, number]> {
  return points.map((point) => [point.latitude, point.longitude] as [number, number])
}

function focusParticipantInVisibleArea(
  map: LeafletMap,
  bottomInsetPx: number,
  topInsetPx: number,
) {
  const offsetY = Math.max(0, Math.round((bottomInsetPx - topInsetPx) / 2))
  if (offsetY > 0) {
    map.panBy([0, offsetY], { animate: false })
  }
}

type LiveShareTrackingMapProps = {
  points: LiveSharePoint[]
  participantLabel: string
  participantName: string
  participantPhotoUrl?: string | null
  bottomInsetPx?: number
  topInsetPx?: number
}

export const LiveShareTrackingMap = forwardRef<LiveShareTrackingMapHandle, LiveShareTrackingMapProps>(
  function LiveShareTrackingMap(
    {
      points,
      participantLabel,
      participantName,
      participantPhotoUrl,
      bottomInsetPx = DEFAULT_BOTTOM_INSET,
      topInsetPx = DEFAULT_TOP_INSET,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<LeafletMap | null>(null)
    const layerRef = useRef<LeafletLayerGroup | null>(null)
    const autoFollowRef = useRef(true)
    const hasInitialFitRef = useRef(false)
    const mapReadyRef = useRef(false)
    const latlngsRef = useRef<Array<[number, number]>>([])
    const isProgrammaticMoveRef = useRef(false)
    const insetsRef = useRef({ bottom: bottomInsetPx, top: topInsetPx })

    useEffect(() => {
      insetsRef.current = { bottom: bottomInsetPx, top: topInsetPx }
      if (mapReadyRef.current && autoFollowRef.current) {
        centerOnParticipant(false)
      }
    }, [bottomInsetPx, topInsetPx])

    const centerOnParticipant = useCallback(
      (animate = true) => {
        const map = mapRef.current
        const latlngs = latlngsRef.current
        if (!map || !mapReadyRef.current || latlngs.length === 0) return

        const latest = latlngs[latlngs.length - 1]
        const { bottom, top } = insetsRef.current

        autoFollowRef.current = true
        isProgrammaticMoveRef.current = true

        const finishMove = () => {
          focusParticipantInVisibleArea(map, bottom, top)
          window.setTimeout(() => {
            isProgrammaticMoveRef.current = false
          }, 50)
        }

        if (animate) {
          map.flyTo(latest, FOCUS_ZOOM, { duration: 0.75 })
          map.once('moveend', finishMove)
        } else {
          map.setView(latest, FOCUS_ZOOM, { animate: false })
          finishMove()
        }
      },
      [],
    )

    useImperativeHandle(
      ref,
      () => ({
        centerOnParticipant: () => centerOnParticipant(true),
      }),
      [centerOnParticipant],
    )

    useEffect(() => {
      let cancelled = false

      async function initMap() {
        if (!containerRef.current || points.length === 0) return

        const L = await loadLeafletAssets()
        if (cancelled || !containerRef.current) return

        latlngsRef.current = toLatLngs(points)
        const latlngs = latlngsRef.current
        const latest = latlngs[latlngs.length - 1]
        if (!latest) return

        if (!mapRef.current) {
          mapRef.current = L.map(containerRef.current, {
            center: latest,
            zoom: FOCUS_ZOOM,
            zoomControl: false,
            attributionControl: false,
          })

          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
          }).addTo(mapRef.current)

          layerRef.current = L.layerGroup().addTo(mapRef.current)

          mapRef.current.on('dragstart', () => {
            if (!isProgrammaticMoveRef.current) autoFollowRef.current = false
          })
          mapRef.current.on('zoomstart', () => {
            if (!isProgrammaticMoveRef.current) autoFollowRef.current = false
          })

          mapReadyRef.current = true
        }

        layerRef.current?.clearLayers()

        if (latlngs.length > 1) {
          L.polyline(latlngs, {
            color: '#22c55e',
            weight: 4,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(layerRef.current!)
        }

        const hasPhoto = Boolean(participantPhotoUrl?.trim())
        const markerIcon = L.divIcon({
          className: 'live-share-photo-marker',
          html: buildLiveShareMapMarkerHtml(participantPhotoUrl, participantName),
          iconSize: hasPhoto ? [36, 36] : [30, 30],
          iconAnchor: hasPhoto ? [18, 18] : [15, 15],
        })

        L.marker(latest, { icon: markerIcon, zIndexOffset: 1000 }).addTo(layerRef.current!)

        if (!hasInitialFitRef.current || autoFollowRef.current) {
          centerOnParticipant(!hasInitialFitRef.current)
          hasInitialFitRef.current = true
        }

        mapRef.current.invalidateSize()
      }

      void initMap()

      return () => {
        cancelled = true
      }
    }, [points, participantLabel, participantName, participantPhotoUrl, centerOnParticipant])

    useEffect(() => {
      return () => {
        mapRef.current?.remove()
        mapRef.current = null
        layerRef.current = null
        mapReadyRef.current = false
        hasInitialFitRef.current = false
      }
    }, [])

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 z-0 bg-[#0b0f14]"
        aria-label={`Mapa de acompanhamento de ${participantLabel}`}
      />
    )
  },
)

LiveShareTrackingMap.displayName = 'LiveShareTrackingMap'

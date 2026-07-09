import { useEffect, useRef, useState } from 'react'
import { colors } from '../../../theme/colors'
import { StyleSheet, View } from 'react-native'
import { resizeImageByLongEdge } from '../../../adapters/imageManipulation'
import { profilePhotoToDataUri } from '../../../utils/profilePhotoImage'
import {
  buildNearbyRunningRoutesMapMarkers,
  buildNearbyRunningRoutesUserPinHtml,
  getNearbyRunningRoutesMapView,
  getNearbyRunningRoutesUserPinMetrics,
  RUNNING_ROUTES_LEAFLET_CSS_URL,
  RUNNING_ROUTES_LEAFLET_JS_URL,
  RUNNING_ROUTES_MAP_CUSTOM_CSS,
  RUNNING_ROUTES_MDI_CSS_URL,
  RUNNING_ROUTES_TILE_URL,
  type NearbyRunningRoutesMapProps,
} from './nearbyRunningRoutesMapShared'

type LeafletNamespace = {
  map: (element: HTMLElement, options: Record<string, unknown>) => LeafletMap
  tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: LeafletMap) => void }
  divIcon: (options: Record<string, unknown>) => unknown
  marker: (
    latlng: [number, number],
    options: Record<string, unknown>,
  ) => LeafletMarker
  featureGroup: (layers: LeafletLayer[]) => {
    getBounds: () => { pad: (value: number) => unknown }
  }
}

type LeafletMap = {
  remove: () => void
  stop: () => void
  invalidateSize: () => void
  setView: (center: [number, number], zoom: number, options?: Record<string, unknown>) => void
  fitBounds: (bounds: unknown, options?: Record<string, unknown>) => void
}

type LeafletLayer = {
  remove: () => void
}

type LeafletMarker = LeafletLayer & {
  addTo: (map: LeafletMap) => LeafletMarker
  bindTooltip: (label: string, options: Record<string, unknown>) => LeafletMarker
  on: (event: string, handler: () => void) => void
}

declare global {
  interface Window {
    L?: LeafletNamespace
  }
}

let mapAssetsPromise: Promise<LeafletNamespace> | null = null
let customStylesInjected = false

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
  if (customStylesInjected) return

  const style = document.createElement('style')
  style.setAttribute('data-nearby-running-routes-map', 'true')
  style.textContent = RUNNING_ROUTES_MAP_CUSTOM_CSS
  document.head.appendChild(style)
  customStylesInjected = true
}

async function ensureMapAssets(): Promise<LeafletNamespace> {
  if (window.L) return window.L

  if (!mapAssetsPromise) {
    mapAssetsPromise = (async () => {
      await Promise.all([
        loadStylesheet(RUNNING_ROUTES_LEAFLET_CSS_URL),
        loadStylesheet(RUNNING_ROUTES_MDI_CSS_URL),
      ])
      injectCustomMapStyles()
      await loadScript(RUNNING_ROUTES_LEAFLET_JS_URL)

      if (!window.L) {
        throw new Error('Leaflet failed to initialize on web.')
      }

      return window.L
    })()
  }

  return mapAssetsPromise
}

function disposeLeafletMap(map: LeafletMap | null, host?: HTMLElement | null) {
  if (!map) return

  try {
    map.stop()
  } catch {
    // Ignore teardown races while Leaflet finishes pan/zoom transitions.
  }

  try {
    map.remove()
  } catch {
    // Ignore teardown races when the host node was already unmounted.
  }

  if (host) {
    host.replaceChildren()
    delete (host as HTMLElement & { _leaflet_id?: number })._leaflet_id
  }
}

export function NearbyRunningRoutesMap({
  origin,
  spots,
  selectedId,
  profilePhotoUri,
  onSelectSpot,
}: NearbyRunningRoutesMapProps) {
  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const onSelectRef = useRef(onSelectSpot)
  const [profilePhotoDataUri, setProfilePhotoDataUri] = useState<string | null>(null)

  useEffect(() => {
    onSelectRef.current = onSelectSpot
  }, [onSelectSpot])

  useEffect(() => {
    const trimmed = profilePhotoUri?.trim()
    if (!trimmed) {
      setProfilePhotoDataUri(null)
      return
    }

    let active = true

    async function loadPhoto() {
      if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        if (active) setProfilePhotoDataUri(trimmed)
        return
      }

      const resized = await resizeImageByLongEdge({ uri: trimmed }, { maxLongEdge: 72, compress: 0.82 })
      const dataUri = await profilePhotoToDataUri(resized.uri)
      if (active) {
        setProfilePhotoDataUri(dataUri)
      }
    }

    void loadPhoto()
    return () => {
      active = false
    }
  }, [profilePhotoUri])

  const bindMapHostRef = (node: View | null) => {
    mapHostRef.current = node as unknown as HTMLDivElement | null
  }

  useEffect(() => {
    let disposed = false
    let renderId = 0

    async function renderMap() {
      const currentRenderId = ++renderId
      const L = await ensureMapAssets()
      if (disposed || currentRenderId !== renderId) return

      const host = mapHostRef.current
      if (!host) return

      disposeLeafletMap(mapRef.current, host)
      mapRef.current = null

      const markers = buildNearbyRunningRoutesMapMarkers(spots, selectedId)
      const { flyLat, flyLng, flyZoom, hasSelection } = getNearbyRunningRoutesMapView(
        origin,
        spots,
        selectedId,
      )
      const userPinHtml = buildNearbyRunningRoutesUserPinHtml(profilePhotoDataUri)
      const { size: userPinSize, anchor: userPinAnchor } =
        getNearbyRunningRoutesUserPinMetrics(profilePhotoDataUri)

      const map = L.map(host, {
        zoomControl: false,
        attributionControl: false,
        zoomAnimation: false,
        fadeAnimation: false,
      }).setView([flyLat, flyLng], flyZoom, { animate: false })

      L.tileLayer(RUNNING_ROUTES_TILE_URL, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map)

      const userIcon = L.divIcon({
        className: 'user-pin-wrap',
        html: userPinHtml,
        iconSize: [userPinSize, userPinSize],
        iconAnchor: [userPinAnchor, userPinAnchor],
      })

      const userMarker = L.marker([origin.latitude, origin.longitude], {
        icon: userIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindTooltip(origin.label, { direction: 'top', offset: [0, -10] })

      const layers: LeafletLayer[] = [userMarker]

      markers.forEach((markerData) => {
        const icon = L.divIcon({
          className: 'spot-pin-wrap',
          html: `<div class="spot-pin ${markerData.selected ? 'selected' : ''}"><i class="mdi mdi-run-fast"></i></div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        })

        const marker = L.marker([markerData.lat, markerData.lng], {
          icon,
          zIndexOffset: markerData.selected ? 900 : 500,
        }).addTo(map)

        marker.bindTooltip(markerData.name, { direction: 'top', offset: [0, -16] })
        marker.on('click', () => onSelectRef.current(markerData.id))
        layers.push(marker)
      })

      if (!hasSelection && layers.length > 1) {
        const group = L.featureGroup(layers)
        map.fitBounds(group.getBounds().pad(0.18), { animate: false })
      }

      mapRef.current = map
      map.invalidateSize()
    }

    void renderMap()

    return () => {
      disposed = true
      disposeLeafletMap(mapRef.current, mapHostRef.current)
      mapRef.current = null
    }
  }, [
    origin.latitude,
    origin.longitude,
    origin.label,
    profilePhotoDataUri,
    spots,
    selectedId,
  ])

  return (
    <View style={styles.wrap}>
      <View ref={bindMapHostRef} style={styles.mapHost} />
      <View style={styles.vignetteTop} pointerEvents="none" />
      <View style={styles.vignetteBottom} pointerEvents="none" />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  mapHost: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
  },
})

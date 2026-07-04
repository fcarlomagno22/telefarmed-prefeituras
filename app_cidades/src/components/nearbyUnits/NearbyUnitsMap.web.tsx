import { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import {
  buildNearbyUnitsMapMarkers,
  getNearbyUnitsMapView,
  NEARBY_UNITS_LEAFLET_CSS_URL,
  NEARBY_UNITS_LEAFLET_JS_URL,
  NEARBY_UNITS_MAP_CUSTOM_CSS,
  NEARBY_UNITS_TILE_URL,
  type NearbyUnitsMapProps,
} from './nearbyUnitsMapShared'

type LeafletNamespace = {
  map: (element: HTMLElement, options: Record<string, unknown>) => LeafletMap
  tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: LeafletMap) => void }
  divIcon: (options: Record<string, unknown>) => unknown
  marker: (
    latlng: [number, number],
    options: Record<string, unknown>,
  ) => LeafletMarker
  polyline: (
    latlngs: [number, number][],
    options: Record<string, unknown>,
  ) => LeafletLayer
  featureGroup: (layers: LeafletLayer[]) => {
    getBounds: () => { pad: (value: number) => unknown }
  }
}

type LeafletMap = {
  remove: () => void
  invalidateSize: () => void
  setView: (center: [number, number], zoom: number) => void
  fitBounds: (bounds: unknown) => void
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

let leafletAssetsPromise: Promise<LeafletNamespace> | null = null
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
  style.setAttribute('data-nearby-units-map', 'true')
  style.textContent = NEARBY_UNITS_MAP_CUSTOM_CSS
  document.head.appendChild(style)
  customStylesInjected = true
}

async function ensureLeaflet(): Promise<LeafletNamespace> {
  if (window.L) return window.L

  if (!leafletAssetsPromise) {
    leafletAssetsPromise = (async () => {
      await loadStylesheet(NEARBY_UNITS_LEAFLET_CSS_URL)
      injectCustomMapStyles()
      await loadScript(NEARBY_UNITS_LEAFLET_JS_URL)

      if (!window.L) {
        throw new Error('Leaflet failed to initialize on web.')
      }

      return window.L
    })()
  }

  return leafletAssetsPromise
}

export function NearbyUnitsMap({ origin, ubts, selectedId, onSelectUbt }: NearbyUnitsMapProps) {
  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const onSelectRef = useRef(onSelectUbt)

  useEffect(() => {
    onSelectRef.current = onSelectUbt
  }, [onSelectUbt])

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

      mapRef.current?.remove()
      mapRef.current = null

      const markers = buildNearbyUnitsMapMarkers(ubts, selectedId)
      const { flyLat, flyLng, flyZoom, hasSelection } = getNearbyUnitsMapView(
        origin,
        ubts,
        selectedId,
      )

      const map = L.map(host, { zoomControl: true, attributionControl: false }).setView(
        [flyLat, flyLng],
        flyZoom,
      )

      L.tileLayer(NEARBY_UNITS_TILE_URL, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map)

      const userIcon = L.divIcon({
        className: 'user-pin-wrap',
        html: '<div class="user-pin"><div class="user-pulse"></div></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })

      const userMarker = L.marker([origin.latitude, origin.longitude], {
        icon: userIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindTooltip(origin.label, { direction: 'top', offset: [0, -10] })

      const layers: LeafletLayer[] = [userMarker]
      let routeLine: LeafletLayer | null = null

      markers.forEach((markerData) => {
        const icon = L.divIcon({
          className: 'ubt-pin-wrap',
          html: `<div class="ubt-pin ${markerData.selected ? 'selected' : ''} ${markerData.open ? '' : 'closed'}">+</div>`,
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

        if (markerData.selected) {
          routeLine?.remove()
          routeLine = L.polyline(
            [
              [origin.latitude, origin.longitude],
              [markerData.lat, markerData.lng],
            ],
            { color: '#ff8533', weight: 3, opacity: 0.85, dashArray: '6 8' },
          ).addTo(map)
        }
      })

      if (!hasSelection && layers.length > 1) {
        const group = L.featureGroup(layers)
        map.fitBounds(group.getBounds().pad(0.2))
      }

      mapRef.current = map
      map.invalidateSize()
    }

    void renderMap()

    return () => {
      disposed = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [origin.latitude, origin.longitude, origin.label, ubts, selectedId])

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
    backgroundColor: '#0b0f14',
  },
  mapHost: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0b0f14',
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(10, 10, 12, 0.35)',
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(10, 10, 12, 0.2)',
  },
})

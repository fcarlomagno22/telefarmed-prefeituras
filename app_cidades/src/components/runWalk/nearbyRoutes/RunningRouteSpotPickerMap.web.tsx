import { drawerChrome } from '../../../theme/drawerChrome'
import { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import {
  SPOT_PICKER_LEAFLET_CSS_URL,
  SPOT_PICKER_LEAFLET_JS_URL,
  SPOT_PICKER_MAP_CUSTOM_CSS,
  SPOT_PICKER_PICK_MARKER_HTML,
  SPOT_PICKER_TILE_URL,
  SPOT_PICKER_USER_PIN_HTML,
  type RunningRouteSpotPickerMapProps,
} from './runningRouteSpotPickerMapShared'

type LeafletNamespace = {
  map: (element: HTMLElement, options: Record<string, unknown>) => LeafletMap
  tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: LeafletMap) => void }
  divIcon: (options: Record<string, unknown>) => unknown
  marker: (
    latlng: [number, number],
    options: Record<string, unknown>,
  ) => LeafletDraggableMarker
}

type LeafletMap = {
  remove: () => void
  invalidateSize: () => void
  on: (
    event: string,
    handler: (event: { latlng: { lat: number; lng: number } }) => void,
  ) => void
}

type LeafletDraggableMarker = {
  addTo: (map: LeafletMap) => LeafletDraggableMarker
  setLatLng: (latlng: [number, number]) => void
  getLatLng: () => { lat: number; lng: number }
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
  style.setAttribute('data-running-route-spot-picker-map', 'true')
  style.textContent = SPOT_PICKER_MAP_CUSTOM_CSS
  document.head.appendChild(style)
  customStylesInjected = true
}

async function ensureMapAssets(): Promise<LeafletNamespace> {
  if (window.L) return window.L

  if (!mapAssetsPromise) {
    mapAssetsPromise = (async () => {
      await loadStylesheet(SPOT_PICKER_LEAFLET_CSS_URL)
      injectCustomMapStyles()
      await loadScript(SPOT_PICKER_LEAFLET_JS_URL)

      if (!window.L) {
        throw new Error('Leaflet failed to initialize on web.')
      }

      return window.L
    })()
  }

  return mapAssetsPromise
}

export function RunningRouteSpotPickerMap({
  initialLatitude,
  initialLongitude,
  initialZoom = 16,
  initialPin = null,
  userLocation = null,
  onPick,
  fullBleed = false,
}: RunningRouteSpotPickerMapProps) {
  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const onPickRef = useRef(onPick)

  useEffect(() => {
    onPickRef.current = onPick
  }, [onPick])

  const bindMapHostRef = (node: View | null) => {
    mapHostRef.current = node as unknown as HTMLDivElement | null
  }

  useEffect(() => {
    let disposed = false

    async function renderMap() {
      const L = await ensureMapAssets()
      if (disposed) return

      const host = mapHostRef.current
      if (!host) return

      mapRef.current?.remove()
      mapRef.current = null

      const map = L.map(host, {
        zoomControl: true,
        attributionControl: false,
      }).setView([initialLatitude, initialLongitude], initialZoom)

      L.tileLayer(SPOT_PICKER_TILE_URL, {
        maxZoom: 19,
      }).addTo(map)

      const pickIcon = L.divIcon({
        className: '',
        html: SPOT_PICKER_PICK_MARKER_HTML,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      })

      const userIcon = L.divIcon({
        className: '',
        html: SPOT_PICKER_USER_PIN_HTML,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })

      let pickMarker: LeafletDraggableMarker | null = null

      function notifyPick(lat: number, lng: number) {
        onPickRef.current({ latitude: lat, longitude: lng })
      }

      function setPickMarker(lat: number, lng: number) {
        if (pickMarker) {
          pickMarker.setLatLng([lat, lng])
        } else {
          pickMarker = L.marker([lat, lng], { icon: pickIcon, draggable: true }).addTo(map)
          pickMarker.on('dragend', () => {
            const position = pickMarker?.getLatLng()
            if (!position) return
            notifyPick(position.lat, position.lng)
          })
        }

        notifyPick(lat, lng)
      }

      if (userLocation) {
        L.marker([userLocation.latitude, userLocation.longitude], {
          icon: userIcon,
          interactive: false,
        }).addTo(map)
      }

      if (initialPin) {
        setPickMarker(initialPin.latitude, initialPin.longitude)
      }

      map.on('click', (event) => {
        setPickMarker(event.latlng.lat, event.latlng.lng)
      })

      mapRef.current = map
      map.invalidateSize()
    }

    void renderMap()

    return () => {
      disposed = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [
    initialLatitude,
    initialLongitude,
    initialZoom,
    initialPin?.latitude,
    initialPin?.longitude,
    userLocation?.latitude,
    userLocation?.longitude,
  ])

  return (
    <View style={[styles.container, fullBleed && styles.containerFullBleed]}>
      <View ref={bindMapHostRef} style={styles.mapHost} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 280,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  containerFullBleed: {
    ...StyleSheet.absoluteFillObject,
    minHeight: 0,
    borderRadius: 0,
    borderWidth: 0,
  },
  mapHost: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: drawerChrome.surfaceBottom,
  },
})

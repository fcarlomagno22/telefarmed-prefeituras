import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  createScheduleUbtLeafletMap,
  createScheduleUbtMapController,
  type ScheduleUbtMapController,
} from './scheduleUbtMapLeafletEngine'
import {
  SCHEDULE_UBT_LAYER_OPTIONS,
  SCHEDULE_UBT_LEAFLET_CSS_URL,
  SCHEDULE_UBT_LEAFLET_JS_URL,
  SCHEDULE_UBT_MAP_CONTAINER_CSS,
  type ScheduleUbtMapLayerMode,
  type ScheduleUbtMapProps,
} from './scheduleUbtMapShared'
import { colors } from '../../theme/colors'

type LeafletNamespace = {
  map: (element: HTMLElement, options: Record<string, unknown>) => unknown
  tileLayer: (url: string, options: Record<string, unknown>) => unknown
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
  const styleId = 'schedule-ubt-map-styles'
  if (document.querySelector(`style[data-${styleId}]`)) return

  const style = document.createElement('style')
  style.setAttribute(`data-${styleId}`, 'true')
  style.textContent = SCHEDULE_UBT_MAP_CONTAINER_CSS
  document.head.appendChild(style)
}

async function ensureLeaflet(): Promise<LeafletNamespace> {
  if (window.L) return window.L

  if (!mapAssetsPromise) {
    mapAssetsPromise = (async () => {
      await loadStylesheet(SCHEDULE_UBT_LEAFLET_CSS_URL)
      injectCustomMapStyles()
      await loadScript(SCHEDULE_UBT_LEAFLET_JS_URL)

      if (!window.L) {
        throw new Error('Leaflet failed to initialize on web.')
      }

      return window.L
    })()
  }

  return mapAssetsPromise
}

export function ScheduleUbtMap({ home, ubts, selectedId, onSelectUbt }: ScheduleUbtMapProps) {
  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<{ remove: () => void } | null>(null)
  const controllerRef = useRef<ScheduleUbtMapController | null>(null)
  const onSelectRef = useRef(onSelectUbt)
  const [activeLayer, setActiveLayer] = useState<ScheduleUbtMapLayerMode>('street')

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

      controllerRef.current?.destroy()
      controllerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null

      const map = createScheduleUbtLeafletMap(L, host)
      controllerRef.current = createScheduleUbtMapController({
        L,
        map,
        home,
        ubts,
        selectedId,
        onSelectUbt: (id) => onSelectRef.current(id),
      })

      mapRef.current = map
      controllerRef.current.invalidateSize()
    }

    void renderMap()

    return () => {
      disposed = true
      controllerRef.current?.destroy()
      controllerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [home.latitude, home.longitude])

  useEffect(() => {
    controllerRef.current?.updateMarkers(home, ubts, selectedId)
  }, [home.latitude, home.longitude, selectedId, ubts])

  function handleLayerChange(mode: ScheduleUbtMapLayerMode) {
    setActiveLayer(mode)
    controllerRef.current?.setMapLayer(mode)
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.mapArea}>
        <View ref={bindMapHostRef} style={styles.mapHost} />
        <View style={styles.layerSwitch}>
          {SCHEDULE_UBT_LAYER_OPTIONS.map((option) => {
            const isActive = activeLayer === option.mode
            return (
              <Pressable
                key={option.mode}
                onPress={() => handleLayerChange(option.mode)}
                style={[styles.layerBtn, isActive && styles.layerBtnActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Camada ${option.label}`}
              >
                <Text style={[styles.layerBtnText, isActive && styles.layerBtnTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendHome]} />
          <Text style={styles.legendText}>Sua casa</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendUbt]} />
          <Text style={styles.legendText}>UBTs</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.28)',
    backgroundColor: 'rgba(14, 14, 20, 0.9)',
  },
  mapArea: {
    height: 220,
    position: 'relative',
    backgroundColor: '#e8edf2',
  },
  mapHost: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  layerSwitch: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
    flexDirection: 'row',
    gap: 3,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 14, 20, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  layerBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  layerBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  layerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(245, 245, 247, 0.72)',
  },
  layerBtnTextActive: {
    color: '#fff',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(10, 10, 12, 0.92)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  legendHome: {
    backgroundColor: '#4dabf7',
  },
  legendUbt: {
    backgroundColor: colors.primary,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
})

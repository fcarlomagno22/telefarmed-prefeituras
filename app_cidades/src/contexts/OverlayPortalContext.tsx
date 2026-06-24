import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { StyleSheet, View } from 'react-native'

type OverlayLayer = {
  id: string
  node: ReactNode
  zIndex: number
}

type OverlayPortalContextValue = {
  mount: (id: string, node: ReactNode) => void
  unmount: (id: string) => void
  update: (id: string, node: ReactNode) => void
}

const OverlayPortalContext = createContext<OverlayPortalContextValue | null>(null)

export function OverlayPortalProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<OverlayLayer[]>([])
  const zCounterRef = useRef(0)

  const mount = useCallback((id: string, node: ReactNode) => {
    setLayers((prev) => {
      const existing = prev.find((layer) => layer.id === id)
      if (existing) {
        return prev.map((layer) => (layer.id === id ? { ...layer, node } : layer))
      }

      zCounterRef.current += 1
      return [...prev, { id, node, zIndex: zCounterRef.current }].sort(
        (a, b) => a.zIndex - b.zIndex,
      )
    })
  }, [])

  const update = useCallback((id: string, node: ReactNode) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === id ? { ...layer, node } : layer)),
    )
  }, [])

  const unmount = useCallback((id: string) => {
    setLayers((prev) => prev.filter((layer) => layer.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      mount,
      unmount,
      update,
    }),
    [mount, unmount, update],
  )

  return (
    <OverlayPortalContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        <View style={styles.host} pointerEvents="box-none">
          {layers.map((layer) => (
            <View
              key={layer.id}
              style={[styles.layer, { zIndex: layer.zIndex, elevation: layer.zIndex }]}
              pointerEvents="box-none"
            >
              {layer.node}
            </View>
          ))}
        </View>
      </View>
    </OverlayPortalContext.Provider>
  )
}

export function useOverlayPortal() {
  const context = useContext(OverlayPortalContext)
  if (!context) {
    throw new Error('useOverlayPortal must be used within OverlayPortalProvider')
  }
  return context
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100000,
    elevation: 100000,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
})

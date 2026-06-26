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
  zIndex: number
}

type OverlayPortalContextValue = {
  mount: (id: string) => void
  unmount: (id: string) => void
  setContent: (id: string, node: ReactNode) => void
  clearContent: (id: string) => void
}

const OverlayPortalContext = createContext<OverlayPortalContextValue | null>(null)

export function OverlayPortalProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<OverlayLayer[]>([])
  const [contentVersion, setContentVersion] = useState(0)
  const zCounterRef = useRef(0)
  const contentRef = useRef(new Map<string, ReactNode>())

  const mount = useCallback((id: string) => {
    setLayers((prev) => {
      if (prev.some((layer) => layer.id === id)) return prev

      zCounterRef.current += 1
      return [...prev, { id, zIndex: zCounterRef.current }].sort(
        (a, b) => a.zIndex - b.zIndex,
      )
    })
  }, [])

  const unmount = useCallback((id: string) => {
    contentRef.current.delete(id)
    setLayers((prev) => prev.filter((layer) => layer.id !== id))
  }, [])

  const setContent = useCallback((id: string, node: ReactNode) => {
    contentRef.current.set(id, node)
    setContentVersion((version) => version + 1)
  }, [])

  const clearContent = useCallback((id: string) => {
    contentRef.current.delete(id)
    setContentVersion((version) => version + 1)
  }, [])

  const value = useMemo(
    () => ({
      mount,
      unmount,
      setContent,
      clearContent,
    }),
    [mount, unmount, setContent, clearContent],
  )

  void contentVersion

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
              {contentRef.current.get(layer.id) ?? null}
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

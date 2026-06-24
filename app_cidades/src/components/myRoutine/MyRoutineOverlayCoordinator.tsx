import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'

type OverlayEntry = {
  id: string
  priority: number
  isOpen: boolean
  close: () => void
}

type MyRoutineOverlayCoordinatorContextValue = {
  registerOverlay: (id: string, priority: number, close: () => void) => () => void
  setOverlayOpen: (id: string, isOpen: boolean) => void
  hasOpenOverlay: boolean
  closeTopOverlay: () => boolean
}

const MyRoutineOverlayCoordinatorContext =
  createContext<MyRoutineOverlayCoordinatorContextValue | null>(null)

export function MyRoutineOverlayCoordinator({ children }: { children: ReactNode }) {
  const entriesRef = useRef<Map<string, OverlayEntry>>(new Map())
  const [openVersion, setOpenVersion] = useState(0)

  const registerOverlay = useCallback((id: string, priority: number, close: () => void) => {
    entriesRef.current.set(id, { id, priority, isOpen: false, close })

    return () => {
      entriesRef.current.delete(id)
      setOpenVersion((current) => current + 1)
    }
  }, [])

  const setOverlayOpen = useCallback((id: string, isOpen: boolean) => {
    const entry = entriesRef.current.get(id)
    if (!entry || entry.isOpen === isOpen) return

    entriesRef.current.set(id, { ...entry, isOpen })
    setOpenVersion((current) => current + 1)
  }, [])

  const hasOpenOverlay = useMemo(() => {
    void openVersion
    return [...entriesRef.current.values()].some((entry) => entry.isOpen)
  }, [openVersion])

  const closeTopOverlay = useCallback(() => {
    void openVersion
    const openEntries = [...entriesRef.current.values()]
      .filter((entry) => entry.isOpen)
      .sort((a, b) => b.priority - a.priority)

    const top = openEntries[0]
    if (!top) return false

    top.close()
    return true
  }, [openVersion])

  useAndroidBackHandler(closeTopOverlay, hasOpenOverlay)

  const value = useMemo(
    () => ({
      registerOverlay,
      setOverlayOpen,
      hasOpenOverlay,
      closeTopOverlay,
    }),
    [closeTopOverlay, hasOpenOverlay, registerOverlay, setOverlayOpen],
  )

  return (
    <MyRoutineOverlayCoordinatorContext.Provider value={value}>
      {children}
    </MyRoutineOverlayCoordinatorContext.Provider>
  )
}

export function useMyRoutineOverlayRegistration(
  id: string,
  priority: number,
  isOpen: boolean,
  close: () => void,
) {
  const context = useContext(MyRoutineOverlayCoordinatorContext)
  if (!context) return

  const { registerOverlay, setOverlayOpen } = context

  const closeRef = useRef(close)
  closeRef.current = close

  useEffect(() => {
    return registerOverlay(id, priority, () => closeRef.current())
  }, [id, priority, registerOverlay])

  useEffect(() => {
    setOverlayOpen(id, isOpen)
  }, [id, isOpen, setOverlayOpen])
}

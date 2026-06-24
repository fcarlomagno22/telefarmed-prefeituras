import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { FeatureAuthDrawer } from '../components/FeatureAuthDrawer'
import { GuestFeatureKey } from '../config/guestFeatures'
import { useAuth } from './AuthContext'

type GuestAuthContextValue = {
  requireAuth: (featureKey: GuestFeatureKey, onAllowed?: () => void) => boolean
}

const GuestAuthContext = createContext<GuestAuthContextValue | null>(null)

export function GuestAuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, navigateTo } = useAuth()
  const [visible, setVisible] = useState(false)
  const [featureKey, setFeatureKey] = useState<GuestFeatureKey | null>(null)

  const requireAuth = useCallback(
    (key: GuestFeatureKey, onAllowed?: () => void) => {
      if (isAuthenticated) {
        onAllowed?.()
        return true
      }

      setFeatureKey(key)
      setVisible(true)
      return false
    },
    [isAuthenticated],
  )

  const closeDrawer = useCallback(() => {
    setVisible(false)
    setFeatureKey(null)
  }, [])

  const value = useMemo(() => ({ requireAuth }), [requireAuth])

  return (
    <GuestAuthContext.Provider value={value}>
      {children}
      <FeatureAuthDrawer
        visible={visible}
        featureKey={featureKey}
        onClose={closeDrawer}
        onLoginPress={() => {
          closeDrawer()
          navigateTo('login')
        }}
        onRegisterPress={() => {
          closeDrawer()
          navigateTo('register')
        }}
      />
    </GuestAuthContext.Provider>
  )
}

export function useGuestAuth() {
  const context = useContext(GuestAuthContext)
  if (!context) {
    throw new Error('useGuestAuth must be used within GuestAuthProvider')
  }
  return context
}

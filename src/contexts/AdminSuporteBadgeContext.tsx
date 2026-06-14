import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAdminAuth } from './AdminAuthContext'
import { fetchSupportKpis, isAdminSuporteApiError } from '../lib/services/admin/suporte'

type AdminSuporteBadgeContextValue = {
  awaitingOperatorReplyCount: number
  refresh: () => Promise<void>
}

const AdminSuporteBadgeContext = createContext<AdminSuporteBadgeContextValue | null>(null)

export function AdminSuporteBadgeProvider({ children }: { children: ReactNode }) {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()
  const [awaitingOperatorReplyCount, setAwaitingOperatorReplyCount] = useState(0)

  const refresh = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setAwaitingOperatorReplyCount(0)
      return
    }

    try {
      const kpis = await fetchSupportKpis(token)
      setAwaitingOperatorReplyCount(kpis.awaitingCount)
    } catch (error) {
      if (!isAdminSuporteApiError(error)) {
        console.error(error)
      }
    }
  }, [getAccessToken])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setAwaitingOperatorReplyCount(0)
      return
    }

    void refresh()

    const intervalId = window.setInterval(() => void refresh(), 60_000)
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void refresh()
    })

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
    }
  }, [isAuthenticated, isBootstrapping, refresh])

  const value = useMemo(
    () => ({ awaitingOperatorReplyCount, refresh }),
    [awaitingOperatorReplyCount, refresh],
  )

  return (
    <AdminSuporteBadgeContext.Provider value={value}>{children}</AdminSuporteBadgeContext.Provider>
  )
}

export function useAdminSuporteAwaitingCount(): number {
  return useContext(AdminSuporteBadgeContext)?.awaitingOperatorReplyCount ?? 0
}

export function useAdminSuporteBadgeActions() {
  return useContext(AdminSuporteBadgeContext)
}

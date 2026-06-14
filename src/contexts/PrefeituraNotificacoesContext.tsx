import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { isPrefeituraNotificationUnread } from '../components/prefeitura/notificacoes/prefeituraNotificacoesUi'
import { usePrefeituraAuth } from './PrefeituraAuthContext'
import {
  fetchPrefeituraNotificationKpis,
  fetchPrefeituraNotifications,
  isPrefeituraNotificacoesApiError,
  markAllPrefeituraNotificationsRead,
  markPrefeituraNotificationRead,
  type PortalNotificationKpisResponse,
} from '../lib/services/prefeitura/notificacoes'
import { emptyPortalNotificationKpis } from '../utils/notificacoes/portalNotificacoesKpiCards'
import { prefeituraNotificacoes, type PrefeituraNotification } from '../data/prefeituraNotificacoesMock'

type PrefeituraNotificacoesContextValue = {
  notifications: PrefeituraNotification[]
  setNotifications: Dispatch<SetStateAction<PrefeituraNotification[]>>
  kpis: PortalNotificationKpisResponse
  hasGestorUnreadInbox: boolean
  isLoading: boolean
  reload: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllInboxRead: () => Promise<number>
}

const PrefeituraNotificacoesContext = createContext<PrefeituraNotificacoesContextValue | null>(
  null,
)

export function PrefeituraNotificacoesProvider({ children }: { children: ReactNode }) {
  const { getAccessToken, isAuthenticated, isBootstrapping } = usePrefeituraAuth()
  const [notifications, setNotifications] = useState<PrefeituraNotification[]>(prefeituraNotificacoes)
  const [kpis, setKpis] = useState<PortalNotificationKpisResponse>({ ...emptyPortalNotificationKpis })
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const [listResult, kpisResult] = await Promise.all([
        fetchPrefeituraNotifications(token, { pageSize: 100 }),
        fetchPrefeituraNotificationKpis(token),
      ])
      setNotifications(listResult.notifications)
      setKpis(kpisResult)
    } catch (error) {
      if (!isPrefeituraNotificacoesApiError(error)) {
        console.error(error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const markAsRead = useCallback(
    async (id: string) => {
      const token = getAccessToken()
      const now = new Date().toISOString()
      setNotifications((current) =>
        current.map((item) =>
          item.id === id && item.direction === 'inbox' && item.readAt === null
            ? { ...item, readAt: now }
            : item,
        ),
      )
      if (token) {
        try {
          await markPrefeituraNotificationRead(token, id)
        } catch {
          void reload()
        }
      }
    },
    [getAccessToken, reload],
  )

  const markAllInboxRead = useCallback(async () => {
    const token = getAccessToken()
    const now = new Date().toISOString()
    const unreadCount = notifications.filter(isPrefeituraNotificationUnread).length
    setNotifications((current) =>
      current.map((item) =>
        item.direction === 'inbox' && item.readAt === null ? { ...item, readAt: now } : item,
      ),
    )
    if (token) {
      try {
        const result = await markAllPrefeituraNotificationsRead(token)
        return result.count
      } catch {
        void reload()
      }
    }
    return unreadCount
  }, [getAccessToken, notifications, reload])

  const hasGestorUnreadInbox = useMemo(
    () => kpis.unreadCount > 0 || notifications.some(isPrefeituraNotificationUnread),
    [kpis.unreadCount, notifications],
  )

  const value = useMemo(
    () => ({
      notifications,
      setNotifications,
      kpis,
      hasGestorUnreadInbox,
      isLoading,
      reload,
      markAsRead,
      markAllInboxRead,
    }),
    [notifications, kpis, hasGestorUnreadInbox, isLoading, reload, markAsRead, markAllInboxRead],
  )

  return (
    <PrefeituraNotificacoesContext.Provider value={value}>
      {children}
    </PrefeituraNotificacoesContext.Provider>
  )
}

export function usePrefeituraNotificacoes() {
  const context = useContext(PrefeituraNotificacoesContext)
  if (!context) {
    throw new Error('usePrefeituraNotificacoes must be used within PrefeituraNotificacoesProvider')
  }
  return context
}

export function usePrefeituraNotificacoesOptional() {
  return useContext(PrefeituraNotificacoesContext)
}

export function usePrefeituraGestorUnreadInbox() {
  const context = usePrefeituraNotificacoesOptional()
  return context?.hasGestorUnreadInbox ?? false
}

export function usePrefeituraNotificationsState() {
  const context = usePrefeituraNotificacoes()
  const setNotifications = useCallback(
    (action: SetStateAction<PrefeituraNotification[]>) => {
      context.setNotifications(action)
    },
    [context],
  )
  return [context.notifications, setNotifications] as const
}

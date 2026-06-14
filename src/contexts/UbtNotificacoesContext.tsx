import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { isPrefeituraNotificationUnread } from '../components/prefeitura/notificacoes/prefeituraNotificacoesUi'
import { useUbtAuth } from './UbtAuthContext'
import type { PrefeituraNotification } from '../data/prefeituraNotificacoesMock'
import {
  createUbtBroadcast,
  fetchUbtNotificationKpis,
  fetchUbtNotifications,
  isUbtNotificacoesApiError,
  markAllUbtNotificationsRead,
  markUbtNotificationRead,
  type CreateUbtBroadcastPayload,
  type UbtNotificationKpisResponse,
} from '../lib/services/ubt/notificacoes'
import { emptyPortalNotificationKpis } from '../utils/notificacoes/portalNotificacoesKpiCards'

export type UbtNotificationListFilters = {
  direction: 'all' | 'inbox' | 'sent'
  origin: 'all' | 'telefarmed' | 'contract_manager'
  read: 'all' | 'unread' | 'read'
  search: string
  page: number
  pageSize: number
}

const DEFAULT_LIST_FILTERS: UbtNotificationListFilters = {
  direction: 'all',
  origin: 'all',
  read: 'all',
  search: '',
  page: 1,
  pageSize: 100,
}

type UbtNotificacoesContextValue = {
  notifications: PrefeituraNotification[]
  setNotifications: Dispatch<SetStateAction<PrefeituraNotification[]>>
  kpis: UbtNotificationKpisResponse
  hasUbtUnreadInbox: boolean
  isLoading: boolean
  isListLoading: boolean
  listFilters: UbtNotificationListFilters
  listTotal: number
  reload: () => Promise<void>
  loadNotifications: (filters: UbtNotificationListFilters) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllInboxRead: () => Promise<number>
  sendBroadcast: (payload: CreateUbtBroadcastPayload) => Promise<void>
}

const UbtNotificacoesContext = createContext<UbtNotificacoesContextValue | null>(null)

export function UbtNotificacoesProvider({ children }: { children: ReactNode }) {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useUbtAuth()
  const [notifications, setNotifications] = useState<PrefeituraNotification[]>([])
  const [kpis, setKpis] = useState<UbtNotificationKpisResponse>({ ...emptyPortalNotificationKpis })
  const [isLoading, setIsLoading] = useState(true)
  const [isListLoading, setIsListLoading] = useState(false)
  const [listFilters, setListFilters] = useState<UbtNotificationListFilters>(DEFAULT_LIST_FILTERS)
  const [listTotal, setListTotal] = useState(0)
  const listFiltersRef = useRef(listFilters)
  listFiltersRef.current = listFilters

  const fetchListAndKpis = useCallback(
    async (filters: UbtNotificationListFilters, options?: { includeKpis?: boolean; initial?: boolean }) => {
      const token = getAccessToken()
      if (!token) {
        if (options?.initial) setIsLoading(false)
        return
      }

      if (options?.initial) setIsLoading(true)
      else setIsListLoading(true)

      try {
        const listPromise = fetchUbtNotifications(token, {
          direction: filters.direction,
          origin: filters.origin === 'all' ? undefined : filters.origin,
          read: filters.read,
          search: filters.search.trim() || undefined,
          page: filters.page,
          pageSize: filters.pageSize,
        })
        const kpisPromise = options?.includeKpis ? fetchUbtNotificationKpis(token) : Promise.resolve(null)

        const [listResult, kpisResult] = await Promise.all([listPromise, kpisPromise])
        setNotifications(listResult.notifications)
        setListTotal(listResult.total)
        if (kpisResult) setKpis(kpisResult)
      } catch (error) {
        if (!isUbtNotificacoesApiError(error)) {
          console.error(error)
        }
      } finally {
        if (options?.initial) setIsLoading(false)
        else setIsListLoading(false)
      }
    },
    [getAccessToken],
  )

  const loadNotifications = useCallback(
    async (filters: UbtNotificationListFilters) => {
      setListFilters(filters)
      await fetchListAndKpis(filters)
    },
    [fetchListAndKpis],
  )

  const reload = useCallback(async () => {
    await fetchListAndKpis(listFiltersRef.current, { includeKpis: true })
  }, [fetchListAndKpis])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setNotifications([])
      setKpis({ ...emptyPortalNotificationKpis })
      setListTotal(0)
      setIsLoading(false)
      return
    }
    void fetchListAndKpis(listFiltersRef.current, { includeKpis: true, initial: true })
  }, [isAuthenticated, isBootstrapping, fetchListAndKpis])

  const markAsRead = useCallback(
    async (id: string) => {
      const token = getAccessToken()
      const now = new Date().toISOString()
      let wasUnread = false

      setNotifications((current) =>
        current.map((item) => {
          if (item.id === id && item.direction === 'inbox' && item.readAt === null) {
            wasUnread = true
            return { ...item, readAt: now }
          }
          return item
        }),
      )

      if (wasUnread) {
        setKpis((current) => ({
          ...current,
          unreadCount: Math.max(0, current.unreadCount - 1),
        }))
      }

      if (token) {
        try {
          await markUbtNotificationRead(token, id)
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
    setKpis((current) => ({ ...current, unreadCount: 0 }))

    if (token) {
      try {
        const result = await markAllUbtNotificationsRead(token)
        setKpis((current) => ({ ...current, unreadCount: 0 }))
        await reload()
        return result.count
      } catch {
        void reload()
      }
    }

    return unreadCount
  }, [getAccessToken, notifications, reload])

  const sendBroadcast = useCallback(
    async (payload: CreateUbtBroadcastPayload) => {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }
      await createUbtBroadcast(token, payload)
      await reload()
    },
    [getAccessToken, reload],
  )

  const hasUbtUnreadInbox = useMemo(
    () => kpis.unreadCount > 0 || notifications.some(isPrefeituraNotificationUnread),
    [kpis.unreadCount, notifications],
  )

  const value = useMemo(
    () => ({
      notifications,
      setNotifications,
      kpis,
      hasUbtUnreadInbox,
      isLoading,
      isListLoading,
      listFilters,
      listTotal,
      reload,
      loadNotifications,
      markAsRead,
      markAllInboxRead,
      sendBroadcast,
    }),
    [
      notifications,
      kpis,
      hasUbtUnreadInbox,
      isLoading,
      isListLoading,
      listFilters,
      listTotal,
      reload,
      loadNotifications,
      markAsRead,
      markAllInboxRead,
      sendBroadcast,
    ],
  )

  return (
    <UbtNotificacoesContext.Provider value={value}>{children}</UbtNotificacoesContext.Provider>
  )
}

export function useUbtNotificacoes() {
  const context = useContext(UbtNotificacoesContext)
  if (!context) {
    throw new Error('useUbtNotificacoes must be used within UbtNotificacoesProvider')
  }
  return context
}

export function useUbtNotificacoesOptional() {
  return useContext(UbtNotificacoesContext)
}

export function useUbtUnreadInbox() {
  const context = useUbtNotificacoesOptional()
  return context?.hasUbtUnreadInbox ?? false
}

export function useUbtNotificationsState() {
  const context = useUbtNotificacoes()
  const setNotifications = useCallback(
    (action: SetStateAction<PrefeituraNotification[]>) => {
      context.setNotifications(action)
    },
    [context],
  )
  return [context.notifications, setNotifications] as const
}

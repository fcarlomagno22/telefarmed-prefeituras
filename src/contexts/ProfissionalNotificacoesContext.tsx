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
import { useProfissionalAuth } from './ProfissionalAuthContext'
import type { PrefeituraNotification } from '../data/prefeituraNotificacoesMock'
import {
  fetchProfissionalNotificationKpis,
  fetchProfissionalNotifications,
  isProfissionalNotificacoesApiError,
  markAllProfissionalNotificationsRead,
  markProfissionalNotificationRead,
  type ProfissionalNotificationKpisResponse,
} from '../lib/services/profissional/notificacoes'
import { emptyPortalNotificationKpis } from '../utils/notificacoes/portalNotificacoesKpiCards'
import {
  readPortalPageCache,
  writePortalPageCache,
} from '../utils/portal/portalPageCache'
import { shouldBlockPortalPageWithCache } from '../utils/portal/portalPageLoading'

const NOTIFICACOES_CACHE_KEY = 'profissional:notificacoes'

export type ProfissionalNotificacoesListFilters = {
  origin?: string
  read?: 'all' | 'unread' | 'read'
  search?: string
  page?: number
  pageSize?: number
}

const DEFAULT_LIST_FILTERS: ProfissionalNotificacoesListFilters = {
  page: 1,
  pageSize: 100,
}

type NotificacoesCache = {
  notifications: PrefeituraNotification[]
  kpis: ProfissionalNotificationKpisResponse
}

function toApiListParams(filters: ProfissionalNotificacoesListFilters) {
  return {
    origin: filters.origin && filters.origin !== 'all' ? filters.origin : undefined,
    read: filters.read && filters.read !== 'all' ? filters.read : undefined,
    search: filters.search?.trim() || undefined,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 100,
  }
}

function isDefaultListFilters(filters: ProfissionalNotificacoesListFilters) {
  return (
    !filters.origin &&
    (!filters.read || filters.read === 'all') &&
    !filters.search?.trim()
  )
}

function getLoadErrorMessage(error: unknown) {
  if (isProfissionalNotificacoesApiError(error)) {
    return error.message
  }
  return 'Não foi possível carregar as notificações. Verifique sua conexão e tente novamente.'
}

type ProfissionalNotificacoesContextValue = {
  notifications: PrefeituraNotification[]
  setNotifications: Dispatch<SetStateAction<PrefeituraNotification[]>>
  kpis: ProfissionalNotificationKpisResponse
  hasProfissionalUnreadInbox: boolean
  isLoading: boolean
  isListLoading: boolean
  loadError: string | null
  listTotal: number
  reload: () => Promise<void>
  applyListFilters: (filters: ProfissionalNotificacoesListFilters) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllInboxRead: () => Promise<number>
}

const ProfissionalNotificacoesContext = createContext<ProfissionalNotificacoesContextValue | null>(
  null,
)

export function ProfissionalNotificacoesProvider({ children }: { children: ReactNode }) {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useProfissionalAuth()
  const [notifications, setNotifications] = useState<PrefeituraNotification[]>(() => {
    return readPortalPageCache<NotificacoesCache>(NOTIFICACOES_CACHE_KEY)?.notifications ?? []
  })
  const [kpis, setKpis] = useState<ProfissionalNotificationKpisResponse>(() => {
    return (
      readPortalPageCache<NotificacoesCache>(NOTIFICACOES_CACHE_KEY)?.kpis ?? {
        ...emptyPortalNotificationKpis,
      }
    )
  })
  const [isLoading, setIsLoading] = useState(shouldBlockPortalPageWithCache(NOTIFICACOES_CACHE_KEY))
  const [isListLoading, setIsListLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [listTotal, setListTotal] = useState(0)
  const listFiltersRef = useRef<ProfissionalNotificacoesListFilters>(DEFAULT_LIST_FILTERS)

  const fetchList = useCallback(
    async (
      filters: ProfissionalNotificacoesListFilters,
      options?: { withKpis?: boolean; initial?: boolean },
    ) => {
      const token = getAccessToken()
      if (!token) {
        setIsLoading(false)
        setIsListLoading(false)
        return
      }

      const withKpis = options?.withKpis ?? false
      const initial = options?.initial ?? false

      if (initial && shouldBlockPortalPageWithCache(NOTIFICACOES_CACHE_KEY)) {
        setIsLoading(true)
      } else if (!withKpis) {
        setIsListLoading(true)
      }

      setLoadError(null)

      try {
        const [listResult, kpisResult] = await Promise.all([
          fetchProfissionalNotifications(token, toApiListParams(filters)),
          withKpis ? fetchProfissionalNotificationKpis(token) : Promise.resolve(null),
        ])

        setNotifications(listResult.notifications)
        setListTotal(listResult.total)

        if (kpisResult) {
          setKpis(kpisResult)
        }

        if (isDefaultListFilters(filters) && kpisResult) {
          writePortalPageCache(NOTIFICACOES_CACHE_KEY, {
            notifications: listResult.notifications,
            kpis: kpisResult,
          })
        }
      } catch (error) {
        setLoadError(getLoadErrorMessage(error))
        if (!isProfissionalNotificacoesApiError(error)) {
          console.error(error)
        }
      } finally {
        setIsLoading(false)
        setIsListLoading(false)
      }
    },
    [getAccessToken],
  )

  const applyListFilters = useCallback(
    async (filters: ProfissionalNotificacoesListFilters) => {
      const next = { ...DEFAULT_LIST_FILTERS, ...filters }
      listFiltersRef.current = next
      await fetchList(next)
    },
    [fetchList],
  )

  const reload = useCallback(async () => {
    await fetchList(listFiltersRef.current, { withKpis: true, initial: true })
  }, [fetchList])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setNotifications([])
      setKpis({ ...emptyPortalNotificationKpis })
      setListTotal(0)
      setLoadError(null)
      setIsLoading(false)
      listFiltersRef.current = DEFAULT_LIST_FILTERS
      return
    }
    void fetchList(DEFAULT_LIST_FILTERS, { withKpis: true, initial: true })
  }, [isAuthenticated, isBootstrapping, fetchList])

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
          await markProfissionalNotificationRead(token, id)
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
    const unreadCount = kpis.unreadCount

    setNotifications((current) =>
      current.map((item) =>
        item.direction === 'inbox' && item.readAt === null ? { ...item, readAt: now } : item,
      ),
    )
    setKpis((current) => ({ ...current, unreadCount: 0 }))

    if (token) {
      try {
        const result = await markAllProfissionalNotificationsRead(token)
        setKpis((current) => ({ ...current, unreadCount: 0 }))
        return result.count
      } catch {
        void reload()
      }
    }

    return unreadCount
  }, [getAccessToken, kpis.unreadCount, reload])

  const hasProfissionalUnreadInbox = useMemo(
    () => kpis.unreadCount > 0 || notifications.some(isPrefeituraNotificationUnread),
    [kpis.unreadCount, notifications],
  )

  const value = useMemo(
    () => ({
      notifications,
      setNotifications,
      kpis,
      hasProfissionalUnreadInbox,
      isLoading,
      isListLoading,
      loadError,
      listTotal,
      reload,
      applyListFilters,
      markAsRead,
      markAllInboxRead,
    }),
    [
      notifications,
      kpis,
      hasProfissionalUnreadInbox,
      isLoading,
      isListLoading,
      loadError,
      listTotal,
      reload,
      applyListFilters,
      markAsRead,
      markAllInboxRead,
    ],
  )

  return (
    <ProfissionalNotificacoesContext.Provider value={value}>
      {children}
    </ProfissionalNotificacoesContext.Provider>
  )
}

export function useProfissionalNotificacoes() {
  const context = useContext(ProfissionalNotificacoesContext)
  if (!context) {
    throw new Error(
      'useProfissionalNotificacoes must be used within ProfissionalNotificacoesProvider',
    )
  }
  return context
}

export function useProfissionalNotificacoesOptional() {
  return useContext(ProfissionalNotificacoesContext)
}

export function useProfissionalUnreadInbox() {
  const context = useProfissionalNotificacoesOptional()
  return context?.hasProfissionalUnreadInbox ?? false
}

export function useProfissionalNotificationsState() {
  const context = useProfissionalNotificacoes()
  const setNotifications = useCallback(
    (action: SetStateAction<PrefeituraNotification[]>) => {
      context.setNotifications(action)
    },
    [context],
  )
  return [context.notifications, setNotifications] as const
}

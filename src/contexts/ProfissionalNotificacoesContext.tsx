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
import { useQuery } from '@tanstack/react-query'
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
import { queryKeys } from '../lib/query/keys'
import { PORTAL_PAGE_GC_MS, PORTAL_PAGE_STALE_MS } from '../lib/query/timings'

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
  const [listFilters, setListFilters] = useState(DEFAULT_LIST_FILTERS)
  const [optimisticNotifications, setOptimisticNotifications] = useState<
    PrefeituraNotification[] | null
  >(null)
  const [optimisticKpis, setOptimisticKpis] = useState<ProfissionalNotificationKpisResponse | null>(
    null,
  )

  const kpisQuery = useQuery({
    queryKey: queryKeys.profissionalNotificacoesKpis(),
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return fetchProfissionalNotificationKpis(token)
    },
    enabled: isAuthenticated && !isBootstrapping,
    staleTime: PORTAL_PAGE_STALE_MS,
    gcTime: PORTAL_PAGE_GC_MS,
  })

  const listQuery = useQuery({
    queryKey: queryKeys.profissionalNotificacoes(listFilters),
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return fetchProfissionalNotifications(token, toApiListParams(listFilters))
    },
    enabled: isAuthenticated && !isBootstrapping,
    staleTime: PORTAL_PAGE_STALE_MS,
    gcTime: PORTAL_PAGE_GC_MS,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      setListFilters(DEFAULT_LIST_FILTERS)
      setOptimisticNotifications(null)
      setOptimisticKpis(null)
    }
  }, [isAuthenticated])

  const notifications = optimisticNotifications ?? listQuery.data?.notifications ?? []
  const kpis = optimisticKpis ?? kpisQuery.data ?? { ...emptyPortalNotificationKpis }
  const listTotal = listQuery.data?.total ?? 0

  const setNotifications = useCallback((action: SetStateAction<PrefeituraNotification[]>) => {
    setOptimisticNotifications((current) => {
      const base = current ?? []
      return typeof action === 'function' ? action(base) : action
    })
  }, [])

  const reload = useCallback(async () => {
    setOptimisticNotifications(null)
    setOptimisticKpis(null)
    setListFilters(DEFAULT_LIST_FILTERS)
    await Promise.all([listQuery.refetch(), kpisQuery.refetch()])
  }, [kpisQuery, listQuery])

  const applyListFilters = useCallback(async (filters: ProfissionalNotificacoesListFilters) => {
    setOptimisticNotifications(null)
    const next = { ...DEFAULT_LIST_FILTERS, ...filters }
    setListFilters(next)
  }, [])

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
        setOptimisticKpis((current) => {
          const base = current ?? kpisQuery.data ?? { ...emptyPortalNotificationKpis }
          return {
            ...base,
            unreadCount: Math.max(0, base.unreadCount - 1),
          }
        })
      }

      if (token) {
        try {
          await markProfissionalNotificationRead(token, id)
        } catch {
          void reload()
        }
      }
    },
    [getAccessToken, kpisQuery.data, reload, setNotifications],
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
    setOptimisticKpis((current) => {
      const base = current ?? kpisQuery.data ?? { ...emptyPortalNotificationKpis }
      return { ...base, unreadCount: 0 }
    })

    if (token) {
      try {
        const result = await markAllProfissionalNotificationsRead(token)
        setOptimisticKpis((current) => {
          const base = current ?? kpisQuery.data ?? { ...emptyPortalNotificationKpis }
          return { ...base, unreadCount: 0 }
        })
        return result.count
      } catch {
        void reload()
      }
    }

    return unreadCount
  }, [getAccessToken, kpis.unreadCount, kpisQuery.data, reload, setNotifications])

  const hasProfissionalUnreadInbox = useMemo(
    () => kpis.unreadCount > 0 || notifications.some(isPrefeituraNotificationUnread),
    [kpis.unreadCount, notifications],
  )

  const isLoading =
    isDefaultListFilters(listFilters) &&
    ((kpisQuery.isPending && !kpisQuery.data) || (listQuery.isPending && !listQuery.data))

  const isListLoading = listQuery.isFetching && !listQuery.isPending

  const loadError =
    listQuery.isError || kpisQuery.isError
      ? getLoadErrorMessage(listQuery.error ?? kpisQuery.error)
      : null

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
      setNotifications,
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

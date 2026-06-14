import { useCallback, useEffect, useMemo, useState } from 'react'
import { mapSupportKpisForSidebar } from '../components/admin/suporte/adminSuporteUi'
import type { SupportTicket, SupportTicketStatus } from '../data/suporteMock'
import {
  createPortalSupportTicket,
  deletePortalSupportMessage,
  fetchPortalSupportKpis,
  fetchPortalSupportTicket,
  fetchPortalSupportTickets,
  isPortalSuporteApiError,
  PortalSuporteApiError,
  sendPortalSupportReply,
  updatePortalSupportMessage,
  type CreatePortalSupportTicketInput,
  type PortalSuporteVariant,
} from '../lib/services/portal/suporte'
import {
  readPortalPageCache,
  writePortalPageCache,
} from '../utils/portal/portalPageCache'
import { shouldBlockPortalPageWithCache } from '../utils/portal/portalPageLoading'

const PAGE_SIZE = 10

type SuporteTicketsCache = {
  tickets: SupportTicket[]
  total: number
  totalPages: number
}

function suporteKpisCacheKey(variant: PortalSuporteVariant) {
  return `portal:suporte:${variant}:kpis`
}

function suporteTicketsCacheKey(
  variant: PortalSuporteVariant,
  query: {
    search: string
    status: SupportTicketStatus | ''
    openOnly: boolean
    page: number
  },
) {
  return `portal:suporte:${variant}:tickets:${JSON.stringify(query)}`
}

const DEFAULT_TICKETS_QUERY = {
  search: '',
  status: '' as SupportTicketStatus | '',
  openOnly: true,
  page: 1,
}

function emptySuporteSidebar() {
  return mapSupportKpisForSidebar({
    awaitingCount: 0,
    unreadSupportMessagesCount: 0,
    openCount: 0,
    total: 0,
    statusSummary: [],
    priorityDistribution: [],
    monthlyTrend: [],
  })
}

export type { PortalSuporteVariant }

type UsePortalSuportePageOptions = {
  variant: PortalSuporteVariant
  getAccessToken: () => string | null
  readOnlyForTicket?: (ticket: SupportTicket) => boolean
  /** Quando false, não dispara fetch (estado vem de provider pai). */
  enabled?: boolean
}

export function usePortalSuportePage({
  variant,
  getAccessToken,
  readOnlyForTicket,
  enabled = true,
}: UsePortalSuportePageOptions) {
  const kpisCacheKey = suporteKpisCacheKey(variant)
  const defaultTicketsCacheKey = suporteTicketsCacheKey(variant, DEFAULT_TICKETS_QUERY)

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    return readPortalPageCache<SuporteTicketsCache>(defaultTicketsCacheKey)?.tickets ?? []
  })
  const [total, setTotal] = useState(() => {
    return readPortalPageCache<SuporteTicketsCache>(defaultTicketsCacheKey)?.total ?? 0
  })
  const [totalPages, setTotalPages] = useState(() => {
    return readPortalPageCache<SuporteTicketsCache>(defaultTicketsCacheKey)?.totalPages ?? 1
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | ''>('')
  const [openOnly, setOpenOnly] = useState(true)
  const [isLoadingTickets, setIsLoadingTickets] = useState(() =>
    shouldBlockPortalPageWithCache(defaultTicketsCacheKey),
  )
  const [isLoadingKpis, setIsLoadingKpis] = useState(() =>
    shouldBlockPortalPageWithCache(kpisCacheKey),
  )
  const [sidebarData, setSidebarData] = useState(() => {
    return (
      readPortalPageCache<ReturnType<typeof mapSupportKpisForSidebar>>(kpisCacheKey) ??
      emptySuporteSidebar()
    )
  })
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [isLoadingTicket, setIsLoadingTicket] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const notifyError = useCallback((message: string) => {
    setToast({ message, variant: 'error' })
  }, [])

  const loadKpis = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoadingKpis(false)
      return
    }

    const cacheKey = suporteKpisCacheKey(variant)
    const cached = readPortalPageCache<ReturnType<typeof mapSupportKpisForSidebar>>(cacheKey)
    if (cached) {
      setSidebarData(cached)
    }

    if (shouldBlockPortalPageWithCache(cacheKey)) {
      setIsLoadingKpis(true)
    }

    try {
      const kpis = await fetchPortalSupportKpis(variant, token)
      const mapped = mapSupportKpisForSidebar(kpis)
      setSidebarData(mapped)
      writePortalPageCache(cacheKey, mapped)
    } catch (error) {
      if (isPortalSuporteApiError(error) && error.status === 403) {
        setSidebarData(emptySuporteSidebar())
        return
      }
      const message = isPortalSuporteApiError(error)
        ? error.message
        : 'Não foi possível carregar o resumo.'
      notifyError(message)
    } finally {
      setIsLoadingKpis(false)
    }
  }, [getAccessToken, notifyError, variant])

  const loadTickets = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoadingTickets(false)
      return
    }

    const cacheKey = suporteTicketsCacheKey(variant, {
      search: debouncedSearch,
      status: statusFilter,
      openOnly,
      page: currentPage,
    })
    const cached = readPortalPageCache<SuporteTicketsCache>(cacheKey)
    if (cached) {
      setTickets(cached.tickets)
      setTotal(cached.total)
      setTotalPages(cached.totalPages)
    }

    if (shouldBlockPortalPageWithCache(cacheKey)) {
      setIsLoadingTickets(true)
    }

    try {
      const result = await fetchPortalSupportTickets(variant, token, {
        search: debouncedSearch,
        status: statusFilter || undefined,
        openOnly,
        page: currentPage,
        pageSize: PAGE_SIZE,
      })
      setTickets(result.tickets)
      setTotal(result.total)
      setTotalPages(result.totalPages)
      writePortalPageCache(cacheKey, {
        tickets: result.tickets,
        total: result.total,
        totalPages: result.totalPages,
      })
    } catch (error) {
      if (isPortalSuporteApiError(error) && error.status === 403) {
        setTickets([])
        setTotal(0)
        setTotalPages(1)
        return
      }
      const message = isPortalSuporteApiError(error)
        ? error.message
        : 'Não foi possível carregar os chamados.'
      notifyError(message)
    } finally {
      setIsLoadingTickets(false)
    }
  }, [currentPage, debouncedSearch, getAccessToken, notifyError, openOnly, statusFilter, variant])

  useEffect(() => {
    if (!enabled) return
    void loadKpis()
  }, [enabled, loadKpis])

  useEffect(() => {
    if (!enabled) return
    void loadTickets()
  }, [enabled, loadTickets])

  useEffect(() => {
    if (!enabled) return

    const refreshCounts = () => {
      void loadKpis()
    }

    const intervalId = window.setInterval(refreshCounts, 60_000)
    window.addEventListener('focus', refreshCounts)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshCounts()
    })

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshCounts)
    }
  }, [enabled, loadKpis])

  const refreshAll = useCallback(async () => {
    await Promise.all([loadTickets(), loadKpis()])
  }, [loadKpis, loadTickets])

  const applyTicketUpdate = useCallback((updated: SupportTicket) => {
    setTickets((current) =>
      current.map((ticket) => (ticket.id === updated.id ? { ...ticket, ...updated } : ticket)),
    )
    setSelectedTicket((current) => (current?.id === updated.id ? updated : current))
  }, [])

  const openTicket = useCallback(
    async (ticket: SupportTicket) => {
      const token = getAccessToken()
      if (!token) return

      setSelectedTicket(ticket)
      setIsLoadingTicket(true)
      try {
        const detail = await fetchPortalSupportTicket(variant, token, ticket.id)
        setSelectedTicket(detail)
        applyTicketUpdate(detail)
        void loadKpis()
      } catch (error) {
        const message = isPortalSuporteApiError(error)
          ? error.message
          : 'Não foi possível carregar o chamado.'
        notifyError(message)
      } finally {
        setIsLoadingTicket(false)
      }
    },
    [applyTicketUpdate, getAccessToken, loadKpis, notifyError, variant],
  )

  const createTicket = useCallback(
    async (input: CreatePortalSupportTicketInput) => {
      const token = getAccessToken()
      if (!token) throw new PortalSuporteApiError('Sessão expirada.', 401)

      const ticket = await createPortalSupportTicket(variant, token, input)
      setToast({ message: 'Chamado aberto com sucesso!', variant: 'success' })
      setCurrentPage(1)
      await refreshAll()
      return ticket
    },
    [getAccessToken, refreshAll, variant],
  )

  const supportApi = useMemo(() => {
    return {
      onSendReply: async (body: string, files: File[]) => {
        const token = getAccessToken()
        if (!token || !selectedTicket) throw new Error('Sessão expirada.')
        const updated = await sendPortalSupportReply(variant, token, selectedTicket.id, body, files)
        applyTicketUpdate(updated)
        void refreshAll()
        return updated
      },
      onEditMessage: async (messageId: string, body: string) => {
        const token = getAccessToken()
        if (!token || !selectedTicket) throw new Error('Sessão expirada.')
        const updated = await updatePortalSupportMessage(
          variant,
          token,
          selectedTicket.id,
          messageId,
          body,
        )
        applyTicketUpdate(updated)
        return updated
      },
      onDeleteMessage: async (messageId: string) => {
        const token = getAccessToken()
        if (!token || !selectedTicket) throw new Error('Sessão expirada.')
        const updated = await deletePortalSupportMessage(
          variant,
          token,
          selectedTicket.id,
          messageId,
        )
        applyTicketUpdate(updated)
        return updated
      },
      onCloseTicket: async () => selectedTicket ?? Promise.reject(new Error('Indisponível')),
      onError: notifyError,
    }
  }, [
    applyTicketUpdate,
    getAccessToken,
    notifyError,
    refreshAll,
    selectedTicket,
    variant,
  ])

  const dismissToast = useCallback(() => setToast(null), [])

  return {
    tickets,
    total,
    totalPages,
    currentPage,
    pageSize,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    openOnly,
    setOpenOnly,
    setCurrentPage,
    isLoadingTickets,
    isLoadingKpis,
    sidebarData,
    awaitingOperatorReplyCount: sidebarData.awaitingCount ?? 0,
    unreadSupportMessagesCount: sidebarData.unreadSupportMessagesCount ?? 0,
    selectedTicket,
    setSelectedTicket,
    isLoadingTicket,
    openTicket,
    createTicket,
    supportApi,
    readOnlyForTicket,
    toast,
    dismissToast,
    refreshAll,
    applyTicketUpdate,
  }
}

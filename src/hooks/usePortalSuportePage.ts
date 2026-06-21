import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { queryKeys } from '../lib/query/keys'
import { PORTAL_PAGE_GC_MS, PORTAL_PAGE_STALE_MS } from '../lib/query/timings'

const PAGE_SIZE = 10

type SuporteTicketsCache = {
  tickets: SupportTicket[]
  total: number
  totalPages: number
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
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | ''>('')
  const [openOnly, setOpenOnly] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [isLoadingTicket, setIsLoadingTicket] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const ticketsQueryParams = useMemo(
    () => ({
      search: debouncedSearch,
      status: statusFilter,
      openOnly,
      page: currentPage,
    }),
    [currentPage, debouncedSearch, openOnly, statusFilter],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const notifyError = useCallback((message: string) => {
    setToast({ message, variant: 'error' })
  }, [])

  const kpisQuery = useQuery({
    queryKey: queryKeys.portalSuporteKpis(variant),
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      const kpis = await fetchPortalSupportKpis(variant, token)
      return mapSupportKpisForSidebar(kpis)
    },
    enabled,
    staleTime: PORTAL_PAGE_STALE_MS,
    gcTime: PORTAL_PAGE_GC_MS,
    retry: (_, error) => !(isPortalSuporteApiError(error) && error.status === 403),
  })

  const ticketsQuery = useQuery({
    queryKey: queryKeys.portalSuporteTickets(variant, ticketsQueryParams),
    queryFn: async (): Promise<SuporteTicketsCache> => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      const result = await fetchPortalSupportTickets(variant, token, {
        search: debouncedSearch,
        status: statusFilter || undefined,
        openOnly,
        page: currentPage,
        pageSize: PAGE_SIZE,
      })
      return {
        tickets: result.tickets,
        total: result.total,
        totalPages: result.totalPages,
      }
    },
    enabled,
    staleTime: PORTAL_PAGE_STALE_MS,
    gcTime: PORTAL_PAGE_GC_MS,
    retry: (_, error) => !(isPortalSuporteApiError(error) && error.status === 403),
  })

  useEffect(() => {
    if (!enabled) return
    if (kpisQuery.isError && isPortalSuporteApiError(kpisQuery.error) && kpisQuery.error.status === 403) {
      queryClient.setQueryData(queryKeys.portalSuporteKpis(variant), emptySuporteSidebar())
    }
  }, [enabled, kpisQuery.error, kpisQuery.isError, queryClient, variant])

  useEffect(() => {
    if (!enabled) return
    if (
      ticketsQuery.isError &&
      isPortalSuporteApiError(ticketsQuery.error) &&
      ticketsQuery.error.status === 403
    ) {
      queryClient.setQueryData(queryKeys.portalSuporteTickets(variant, ticketsQueryParams), {
        tickets: [],
        total: 0,
        totalPages: 1,
      })
    }
  }, [enabled, queryClient, ticketsQuery.error, ticketsQuery.isError, ticketsQueryParams, variant])

  useEffect(() => {
    if (kpisQuery.isError && !isPortalSuporteApiError(kpisQuery.error)) {
      notifyError('Não foi possível carregar o resumo.')
    } else if (
      kpisQuery.isError &&
      isPortalSuporteApiError(kpisQuery.error) &&
      kpisQuery.error.status !== 403
    ) {
      notifyError(kpisQuery.error.message)
    }
  }, [kpisQuery.error, kpisQuery.isError, notifyError])

  useEffect(() => {
    if (ticketsQuery.isError && !isPortalSuporteApiError(ticketsQuery.error)) {
      notifyError('Não foi possível carregar os chamados.')
    } else if (
      ticketsQuery.isError &&
      isPortalSuporteApiError(ticketsQuery.error) &&
      ticketsQuery.error.status !== 403
    ) {
      notifyError(ticketsQuery.error.message)
    }
  }, [notifyError, ticketsQuery.error, ticketsQuery.isError])

  useEffect(() => {
    if (!enabled) return

    const refreshCounts = () => {
      void kpisQuery.refetch()
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
  }, [enabled, kpisQuery])

  const refreshAll = useCallback(async () => {
    await Promise.all([ticketsQuery.refetch(), kpisQuery.refetch()])
  }, [kpisQuery, ticketsQuery])

  const applyTicketUpdate = useCallback(
    (updated: SupportTicket) => {
      queryClient.setQueriesData<SuporteTicketsCache>(
        { queryKey: ['portal', 'suporte', variant, 'tickets'] },
        (current) => {
          if (!current) return current
          return {
            ...current,
            tickets: current.tickets.map((ticket) =>
              ticket.id === updated.id ? { ...ticket, ...updated } : ticket,
            ),
          }
        },
      )
      setSelectedTicket((current) => (current?.id === updated.id ? updated : current))
    },
    [queryClient, variant],
  )

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
        void kpisQuery.refetch()
      } catch (error) {
        const message = isPortalSuporteApiError(error)
          ? error.message
          : 'Não foi possível carregar o chamado.'
        notifyError(message)
      } finally {
        setIsLoadingTicket(false)
      }
    },
    [applyTicketUpdate, getAccessToken, kpisQuery, notifyError, variant],
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

  const sidebarData = kpisQuery.data ?? emptySuporteSidebar()
  const tickets = ticketsQuery.data?.tickets ?? []
  const total = ticketsQuery.data?.total ?? 0
  const totalPages = ticketsQuery.data?.totalPages ?? 1

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
    isLoadingTickets: ticketsQuery.isPending,
    isLoadingKpis: kpisQuery.isPending,
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

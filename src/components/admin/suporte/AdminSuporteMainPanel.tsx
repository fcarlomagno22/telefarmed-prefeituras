import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SupportTicket, SupportTicketSource, SupportTicketStatus } from '../../../data/suporteMock'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import {
  closeSupportTicket,
  deleteSupportMessage,
  fetchSupportTicket,
  fetchSupportTickets,
  isAdminSuporteApiError,
  sendSupportReply,
  updateSupportMessage,
} from '../../../lib/services/admin/suporte'
import { useAdminPageAccess } from '../../../hooks/useAdminPageAccess'
import { SuporteStatusFilterMenu } from '../../suporte/SuporteStatusFilterMenu'
import { SupportTicketDrawer } from '../../suporte/SupportTicketDrawer'
import { AdminSuporteTicketsTable } from './AdminSuporteTicketsTable'

const PAGE_SIZE = 10

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

type AdminSuporteMainPanelProps = {
  awaitingCount: number
  onNotify: (message: string, variant?: 'success' | 'error') => void
  onRefreshKpis: () => Promise<void> | void
}

export function AdminSuporteMainPanel({
  awaitingCount,
  onNotify,
  onRefreshKpis,
}: AdminSuporteMainPanelProps) {
  const { pageAccess } = useAdminPageAccess('suporte')
  const { getAccessToken } = useAdminAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingTickets, setIsLoadingTickets] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | ''>('')
  const [sourceFilter, setSourceFilter] = useState<SupportTicketSource | ''>('')
  const [openOnly, setOpenOnly] = useState(true)
  const [awaitingOnly, setAwaitingOnly] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [isLoadingTicket, setIsLoadingTicket] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)
  const hasLoadedTicketsRef = useRef(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadTickets = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoadingTickets(false)
      return
    }

    if (!hasLoadedTicketsRef.current) {
      setIsLoadingTickets(true)
    }
    try {
      const result = await fetchSupportTickets(token, {
        search: debouncedSearch,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        openOnly,
        awaitingOnly,
        page: currentPage,
        pageSize: PAGE_SIZE,
      })
      setTickets(result.tickets)
      setTotal(result.total)
      setTotalPages(result.totalPages)
      hasLoadedTicketsRef.current = true
    } catch (error) {
      const message = isAdminSuporteApiError(error)
        ? error.message
        : 'Não foi possível carregar os chamados.'
      onNotify(message, 'error')
    } finally {
      setIsLoadingTickets(false)
    }
  }, [
    awaitingOnly,
    currentPage,
    debouncedSearch,
    getAccessToken,
    onNotify,
    openOnly,
    sourceFilter,
    statusFilter,
  ])

  useEffect(() => {
    void loadTickets()
  }, [loadTickets])

  const safePage = Math.min(currentPage, totalPages)
  const showingFrom = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(safePage * PAGE_SIZE, total)

  const applyTicketUpdate = useCallback(
    (updated: SupportTicket) => {
      setTickets((current) =>
        current.map((ticket) => (ticket.id === updated.id ? { ...ticket, ...updated } : ticket)),
      )
      setSelectedTicket((current) => (current?.id === updated.id ? updated : current))
    },
    [],
  )

  const refreshAfterMutation = useCallback(async () => {
    await Promise.all([loadTickets(), onRefreshKpis()])
  }, [loadTickets, onRefreshKpis])

  async function openTicket(ticket: SupportTicket) {
    const token = getAccessToken()
    if (!token) return

    setDrawerClosing(false)
    setDrawerOpen(true)
    setSelectedTicket(ticket)
    setIsLoadingTicket(true)

    try {
      const full = await fetchSupportTicket(token, ticket.id)
      setSelectedTicket(full)
    } catch (error) {
      const message = isAdminSuporteApiError(error)
        ? error.message
        : 'Não foi possível abrir o chamado.'
      onNotify(message, 'error')
      setDrawerOpen(false)
      setSelectedTicket(null)
    } finally {
      setIsLoadingTicket(false)
    }
  }

  function closeDrawer() {
    setDrawerClosing(true)
  }

  function handleDrawerTransitionEnd() {
    if (drawerClosing) {
      setDrawerOpen(false)
      setDrawerClosing(false)
      setSelectedTicket(null)
    }
  }

  const supportApi = useMemo(() => {
    if (!selectedTicket) return undefined

    const ticketId = selectedTicket.id

    return {
      onSendReply: async (body: string, files: File[]) => {
        const token = getAccessToken()
        if (!token) throw new Error('Sessão expirada.')
        const updated = await sendSupportReply(token, ticketId, body, files)
        applyTicketUpdate(updated)
        void refreshAfterMutation()
        return updated
      },
      onEditMessage: async (messageId: string, body: string) => {
        const token = getAccessToken()
        if (!token) throw new Error('Sessão expirada.')
        const updated = await updateSupportMessage(token, ticketId, messageId, body)
        applyTicketUpdate(updated)
        return updated
      },
      onDeleteMessage: async (messageId: string) => {
        const token = getAccessToken()
        if (!token) throw new Error('Sessão expirada.')
        const updated = await deleteSupportMessage(token, ticketId, messageId)
        applyTicketUpdate(updated)
        return updated
      },
      onCloseTicket: async () => {
        const token = getAccessToken()
        if (!token) throw new Error('Sessão expirada.')
        const updated = await closeSupportTicket(token, ticketId)
        applyTicketUpdate(updated)
        await refreshAfterMutation()
        return updated
      },
      onError: (message: string) => onNotify(message, 'error'),
    }
  }, [applyTicketUpdate, getAccessToken, onNotify, refreshAfterMutation, selectedTicket])

  return (
    <>
      <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        {awaitingCount > 0 ? (
          <div className="shrink-0 border-b border-amber-100 bg-amber-50/90 px-5 py-2.5 text-xs font-medium text-amber-900 sm:px-6">
            {awaitingCount} chamado
            {awaitingCount === 1 ? '' : 's'} aguardando resposta da equipe Telefarmed.
          </div>
        ) : null}

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
          <label className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Buscar por chamado, UBT ou prefeitura..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5">
              {(
                [
                  { value: '', label: 'Todas origens' },
                  { value: 'ubt', label: 'UBT' },
                  { value: 'prefeitura', label: 'Prefeitura' },
                ] as const
              ).map((option) => (
                <button
                  key={option.value || 'all'}
                  type="button"
                  onClick={() => {
                    setSourceFilter(option.value)
                    setCurrentPage(1)
                  }}
                  className={[
                    'rounded-[0.65rem] px-3 py-2 text-xs font-semibold transition',
                    sourceFilter === option.value
                      ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                      : 'text-gray-600 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => {
                  setOpenOnly(false)
                  setAwaitingOnly(false)
                  setStatusFilter('')
                  setCurrentPage(1)
                }}
                className={[
                  'rounded-[0.65rem] px-3 py-2 text-xs font-semibold transition',
                  !openOnly && !awaitingOnly
                    ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                    : 'text-gray-600 hover:bg-gray-50',
                ].join(' ')}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenOnly(true)
                  setAwaitingOnly(false)
                  setStatusFilter('')
                  setCurrentPage(1)
                }}
                className={[
                  'rounded-[0.65rem] px-3 py-2 text-xs font-semibold transition',
                  openOnly && !awaitingOnly
                    ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                    : 'text-gray-600 hover:bg-gray-50',
                ].join(' ')}
              >
                Abertos
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenOnly(true)
                  setAwaitingOnly(true)
                  setStatusFilter('aguardando_resposta')
                  setCurrentPage(1)
                }}
                className={[
                  'rounded-[0.65rem] px-3 py-2 text-xs font-semibold transition',
                  awaitingOnly
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-gray-600 hover:bg-gray-50',
                ].join(' ')}
              >
                Aguardando nós
              </button>
            </div>

            <div className="relative">
              <button
                id="admin-suporte-status-filter-trigger"
                type="button"
                onClick={() => setFilterOpen((open) => !open)}
                aria-expanded={filterOpen}
                aria-haspopup="dialog"
                className={[
                  'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition',
                  filterOpen || statusFilter
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                ].join(' ')}
              >
                <Filter className="h-4 w-4" strokeWidth={2} />
                Status
              </button>
              <SuporteStatusFilterMenu
                open={filterOpen}
                value={statusFilter}
                triggerId="admin-suporte-status-filter-trigger"
                onClose={() => setFilterOpen(false)}
                onChange={(value) => {
                  setStatusFilter(value)
                  setAwaitingOnly(value === 'aguardando_resposta')
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>
        </div>

        {isLoadingTickets ? (
          <div className="flex flex-1 items-center justify-center py-16 text-sm text-gray-500">
            Carregando chamados…
          </div>
        ) : (
          <AdminSuporteTicketsTable tickets={tickets} onOpenTicket={openTicket} />
        )}

        <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-gray-500">
            {total === 0
              ? 'Nenhum chamado na lista'
              : `Mostrando ${showingFrom} a ${showingTo} de ${formatNumber(total)} chamado${total === 1 ? '' : 's'}`}
          </p>
          <nav className="flex items-center gap-1" aria-label="Paginação de chamados">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                className={[
                  'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium',
                  pageNumber === safePage
                    ? 'border border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                    : 'border border-transparent text-gray-600 hover:bg-gray-50',
                ].join(' ')}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </footer>
      </section>

      <SupportTicketDrawer
        ticket={selectedTicket}
        open={drawerOpen}
        closing={drawerClosing}
        replyAsSupport
        isLoading={isLoadingTicket}
        canReply={pageAccess.canInsert}
        canManageMessages={pageAccess.canEdit || pageAccess.canDelete}
        canCloseTicket={pageAccess.canEdit}
        supportApi={supportApi}
        onClose={closeDrawer}
        onTransitionEnd={handleDrawerTransitionEnd}
      />
    </>
  )
}

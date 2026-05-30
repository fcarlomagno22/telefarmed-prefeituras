import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  adminSupportPagination,
  adminSupportSourceLabels,
  adminSupportTickets,
} from '../../../data/adminSuporteMock'
import type { SupportTicket, SupportTicketSource, SupportTicketStatus } from '../../../data/suporteMock'
import { SuporteStatusFilterMenu } from '../../suporte/SuporteStatusFilterMenu'
import { SupportTicketDrawer } from '../../suporte/SupportTicketDrawer'
import { useAdminPageAccess } from '../../../hooks/useAdminPageAccess'
import { AdminSuporteTicketsTable } from './AdminSuporteTicketsTable'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function filterAdminTickets(
  query: string,
  status: SupportTicketStatus | '',
  source: SupportTicketSource | '',
  tickets: SupportTicket[],
  openOnly: boolean,
  awaitingOnly: boolean,
) {
  const normalized = query.trim().toLowerCase()
  return tickets.filter((ticket) => {
    if (openOnly && ticket.status === 'encerrado') return false
    if (awaitingOnly && ticket.status !== 'aguardando_resposta') return false
    if (status && ticket.status !== status) return false
    if (source && ticket.source !== source) return false
    if (!normalized) return true
    const haystack = [
      ticket.number,
      ticket.subject,
      ticket.category,
      ticket.municipalityName ?? '',
      ticket.ubtName ?? '',
      ticket.openedByName ?? '',
      ticket.source ? adminSupportSourceLabels[ticket.source] : '',
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalized)
  })
}

export function AdminSuporteMainPanel() {
  const { pageAccess } = useAdminPageAccess('suporte')
  const [tickets, setTickets] = useState<SupportTicket[]>(adminSupportTickets)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | ''>('')
  const [sourceFilter, setSourceFilter] = useState<SupportTicketSource | ''>('')
  const [openOnly, setOpenOnly] = useState(true)
  const [awaitingOnly, setAwaitingOnly] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)

  const awaitingCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'aguardando_resposta').length,
    [tickets],
  )

  const pageSize = adminSupportPagination.pageSize

  const filteredTickets = useMemo(
    () =>
      filterAdminTickets(
        search,
        statusFilter,
        sourceFilter,
        tickets,
        openOnly,
        awaitingOnly,
      ),
    [awaitingOnly, openOnly, search, sourceFilter, statusFilter, tickets],
  )

  const totalFiltered = filteredTickets.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedTickets = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredTickets.slice(start, start + pageSize)
  }, [filteredTickets, safePage, pageSize])

  const showingFrom = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize + 1
  const showingTo = Math.min(safePage * pageSize, totalFiltered)

  function openTicket(ticket: SupportTicket) {
    setSelectedTicket(ticket)
    setDrawerClosing(false)
    setDrawerOpen(true)
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

  function handleTicketUpdate(updated: SupportTicket) {
    setTickets((current) =>
      current.map((ticket) => (ticket.id === updated.id ? updated : ticket)),
    )
    setSelectedTicket((current) => (current?.id === updated.id ? updated : current))
  }

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

        <AdminSuporteTicketsTable tickets={paginatedTickets} onOpenTicket={openTicket} />

        <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-gray-500">
            {totalFiltered === 0
              ? 'Nenhum chamado na lista'
              : `Mostrando ${showingFrom} a ${showingTo} de ${formatNumber(totalFiltered)} chamado${totalFiltered === 1 ? '' : 's'}`}
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
        canReply={pageAccess.canInsert}
        canManageMessages={pageAccess.canEdit || pageAccess.canDelete}
        canCloseTicket={pageAccess.canEdit}
        onTicketUpdate={handleTicketUpdate}
        onClose={closeDrawer}
        onTransitionEnd={handleDrawerTransitionEnd}
      />
    </>
  )
}

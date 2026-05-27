import { Building2, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  supportPagination,
  supportTickets,
  type SupportTicket,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from '../../data/suporteMock'
import { getSupportPriorityOption } from './supportPriorityConfig'
import {
  SUPPORT_STATUS_BADGE_WIDTH,
  supportTicketStatusBadgeConfig,
} from './supportStatusBadgeConfig'
import { SupportTicketDrawer } from './SupportTicketDrawer'
import { SuporteStatusFilterMenu } from './SuporteStatusFilterMenu'
import { SituationStatusBadge } from '../ui/SituationStatusBadge'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function PriorityCell({ priority }: { priority: SupportTicketPriority }) {
  const config = getSupportPriorityOption(priority)
  const Icon = config.icon
  return (
    <span
      className={`inline-flex items-center justify-center gap-1 text-sm font-semibold ${config.textClass}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
      {config.label}
    </span>
  )
}

function filterTickets(
  query: string,
  status: SupportTicketStatus | '',
  tickets: SupportTicket[],
  openOnly: boolean,
) {
  const normalized = query.trim().toLowerCase()
  return tickets.filter((ticket) => {
    if (openOnly && ticket.status === 'encerrado') return false
    if (status && ticket.status !== status) return false
    if (!normalized) return true
    const haystack = [
      ticket.number,
      ticket.subject,
      ticket.category,
      ticket.ubtName ?? '',
      ticket.openedByName ?? '',
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalized)
  })
}

type SuporteMainPanelProps = {
  tickets?: SupportTicket[]
  showUbtColumn?: boolean
  readOnlyChat?: boolean
  defaultOpenOnly?: boolean
}

export function SuporteMainPanel({
  tickets = supportTickets,
  showUbtColumn = false,
  readOnlyChat = false,
  defaultOpenOnly = false,
}: SuporteMainPanelProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | ''>('')
  const [openOnly, setOpenOnly] = useState(defaultOpenOnly)
  const [filterOpen, setFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)

  const pageSize = supportPagination.pageSize

  const filteredTickets = useMemo(
    () => filterTickets(search, statusFilter, tickets, openOnly),
    [openOnly, search, statusFilter, tickets],
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

  return (
    <>
      <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
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
              placeholder="Buscar chamado..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {showUbtColumn ? (
              <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpenOnly(false)
                    setCurrentPage(1)
                  }}
                  className={[
                    'rounded-[0.65rem] px-3 py-2 text-xs font-semibold transition',
                    !openOnly
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
                    setCurrentPage(1)
                  }}
                  className={[
                    'rounded-[0.65rem] px-3 py-2 text-xs font-semibold transition',
                    openOnly
                      ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                      : 'text-gray-600 hover:bg-gray-50',
                  ].join(' ')}
                >
                  Abertos
                </button>
              </div>
            ) : null}

            <div className="relative">
            <button
              id="suporte-status-filter-trigger"
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
              Filtrar por status
            </button>
            <SuporteStatusFilterMenu
              open={filterOpen}
              value={statusFilter}
              onClose={() => setFilterOpen(false)}
              onChange={(value) => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}
            />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <table className="w-full table-fixed border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 text-left sm:px-6">Nº do chamado</th>
                {showUbtColumn ? <th className="px-3 py-3 text-left">UBT</th> : null}
                <th className="px-3 py-3 text-left">Assunto</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3 text-center">Prioridade</th>
                <th className="px-3 py-3 text-center">Última atualização</th>
                <th className="w-14 py-3 pl-3 pr-6 text-center sm:pr-8" aria-label="Ações" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td
                    colSpan={showUbtColumn ? 7 : 6}
                    className="px-5 py-12 text-center text-sm text-gray-500 sm:px-6"
                  >
                    Nenhum chamado encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : null}
              {paginatedTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="cursor-pointer text-sm text-gray-700 transition hover:bg-gray-50/80"
                  onClick={() => openTicket(ticket)}
                >
                  <td className="px-5 py-3.5 font-semibold text-gray-900 sm:px-6">
                    {ticket.number}
                  </td>
                  {showUbtColumn ? (
                    <td className="px-3 py-3.5 align-middle">
                      <span className="flex items-center gap-1.5 font-medium text-gray-800">
                        <Building2
                          className="h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]"
                          strokeWidth={2}
                        />
                        <span className="min-w-0 truncate">{ticket.ubtName ?? '—'}</span>
                      </span>
                      {ticket.openedByName ? (
                        <span className="mt-0.5 block truncate text-xs text-gray-500">
                          {ticket.openedByName}
                        </span>
                      ) : null}
                    </td>
                  ) : null}
                  <td className="px-3 py-3.5 font-medium text-gray-800">{ticket.subject}</td>
                  <td className="px-3 py-3.5 text-center align-middle">
                    <SituationStatusBadge
                      config={supportTicketStatusBadgeConfig[ticket.status]}
                      widthClass={SUPPORT_STATUS_BADGE_WIDTH}
                    />
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle">
                    <PriorityCell priority={ticket.priority} />
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle tabular-nums text-gray-600">
                    {ticket.lastUpdate}
                  </td>
                  <td className="py-3.5 pl-3 pr-6 text-center align-middle sm:pr-8">
                    <span className="inline-flex h-8 w-8 items-center justify-center text-gray-400">
                      <ChevronRight className="h-4 w-4" strokeWidth={2} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
        readOnly={readOnlyChat}
        onClose={closeDrawer}
        onTransitionEnd={handleDrawerTransitionEnd}
      />
    </>
  )
}

import { Building2, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { PROFISSIONAL_SUPORTE_TOUR_DEMO_TICKET_ID } from '../../config/profissionalSuporteTour'
import type { SupportTicket, SupportTicketStatus } from '../../data/suporteMock'
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

function PriorityCell({ priority }: { priority: SupportTicket['priority'] }) {
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

type PortalSuporteMainPanelProps = {
  tickets: SupportTicket[]
  showUbtColumn?: boolean
  isLoading?: boolean
  total: number
  totalPages: number
  page: number
  pageSize: number
  search: string
  onSearchChange: (value: string) => void
  statusFilter: SupportTicketStatus | ''
  onStatusFilterChange: (value: SupportTicketStatus | '') => void
  openOnly: boolean
  onOpenOnlyChange: (value: boolean) => void
  onPageChange: (page: number) => void
  selectedTicket: SupportTicket | null
  isLoadingTicket?: boolean
  onOpenTicket: (ticket: SupportTicket) => void
  onTicketUpdate?: (ticket: SupportTicket) => void
  onCloseTicket: () => void
  supportApi?: React.ComponentProps<typeof SupportTicketDrawer>['supportApi']
  readOnlyForTicket?: (ticket: SupportTicket) => boolean
  canReplyToTickets?: boolean
  toolbarActions?: ReactNode
  drawerOpen: boolean
  drawerClosing: boolean
  onDrawerClose: () => void
  onDrawerTransitionEnd: () => void
  tourLockDrawerClose?: boolean
}

export function PortalSuporteMainPanel({
  tickets,
  showUbtColumn = false,
  isLoading = false,
  total,
  totalPages,
  page,
  pageSize,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  openOnly,
  onOpenOnlyChange,
  onPageChange,
  selectedTicket,
  isLoadingTicket = false,
  onOpenTicket,
  onTicketUpdate,
  onCloseTicket,
  supportApi,
  readOnlyForTicket,
  canReplyToTickets = true,
  toolbarActions,
  drawerOpen,
  drawerClosing,
  onDrawerClose,
  onDrawerTransitionEnd,
  tourLockDrawerClose = false,
}: PortalSuporteMainPanelProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const safePage = Math.min(page, totalPages)
  const showingFrom = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const showingTo = Math.min(safePage * pageSize, total)
  const readOnly =
    selectedTicket != null &&
    (readOnlyForTicket?.(selectedTicket) || selectedTicket.status === 'encerrado')

  return (
    <>
      <section
        data-tour="suporte-main-panel"
        className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
          <label data-tour="suporte-search" className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                onSearchChange(e.target.value)
                onPageChange(1)
              }}
              placeholder="Buscar chamado..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => {
                  onOpenOnlyChange(false)
                  onPageChange(1)
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
                  onOpenOnlyChange(true)
                  onPageChange(1)
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

            <div className="relative">
              <button
                id="suporte-status-filter-trigger"
                data-tour="suporte-status-filter"
                type="button"
                aria-expanded={filterOpen}
                aria-haspopup="dialog"
                onClick={() => setFilterOpen((open) => !open)}
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
                  onStatusFilterChange(value)
                  onPageChange(1)
                }}
              />
            </div>

            {toolbarActions}
          </div>
        </div>

        <div data-tour="suporte-table" className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {isLoading && tickets.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-500">
              Carregando chamados…
            </div>
          ) : (
            <table className="w-full table-fixed border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 text-left sm:px-6">Nº do chamado</th>
                  {showUbtColumn ? <th className="px-3 py-3 text-left">UBT</th> : null}
                  <th className="px-3 py-3 text-left">Assunto</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-center">Prioridade</th>
                  <th className="px-3 py-3 text-center">Última atualização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {tickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={showUbtColumn ? 6 : 5}
                      className="px-5 py-12 text-center text-sm text-gray-500 sm:px-6"
                    >
                      Nenhum chamado encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : null}
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    {...(ticket.id === PROFISSIONAL_SUPORTE_TOUR_DEMO_TICKET_ID
                      ? { 'data-tour': 'suporte-view-ticket' }
                      : {})}
                    className="cursor-pointer text-sm text-gray-700 transition hover:bg-gray-50/80"
                    onClick={() => onOpenTicket(ticket)}
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
                          <span className="truncate">{ticket.ubtName ?? '—'}</span>
                        </span>
                      </td>
                    ) : null}
                    <td className="px-3 py-3.5 font-medium text-gray-800">{ticket.subject}</td>
                    <td className="px-3 py-3.5 text-center">
                      <SituationStatusBadge
                        config={supportTicketStatusBadgeConfig[ticket.status]}
                        widthClass={SUPPORT_STATUS_BADGE_WIDTH}
                      />
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <PriorityCell priority={ticket.priority} />
                    </td>
                    <td className="px-3 py-3.5 text-center text-gray-600">{ticket.lastUpdate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div
          data-tour="suporte-pagination"
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-3 text-xs text-gray-500 sm:px-6"
        >
          <p>
            Exibindo {formatNumber(showingFrom)}–{formatNumber(showingTo)} de{' '}
            {formatNumber(total)} chamados
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => onPageChange(safePage - 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-medium text-gray-700">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => onPageChange(safePage + 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <SupportTicketDrawer
        ticket={selectedTicket}
        open={drawerOpen}
        closing={drawerClosing}
        readOnly={readOnly}
        canReply={canReplyToTickets}
        isLoading={isLoadingTicket}
        supportApi={readOnly ? undefined : supportApi}
        onTicketUpdate={onTicketUpdate}
        onClose={onDrawerClose}
        onTransitionEnd={onDrawerTransitionEnd}
        tourLockClose={tourLockDrawerClose}
      />
    </>
  )
}

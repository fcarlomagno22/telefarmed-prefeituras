import { Building2, ChevronRight } from 'lucide-react'
import type { SupportTicket, SupportTicketPriority } from '../../../data/suporteMock'
import { getSupportPriorityOption } from '../../suporte/supportPriorityConfig'
import {
  SUPPORT_SOURCE_BADGE_WIDTH,
  supportSourceBadgeConfig,
} from '../../suporte/supportSourceBadgeConfig'
import {
  SUPPORT_STATUS_BADGE_WIDTH,
  supportTicketStatusBadgeConfig,
} from '../../suporte/supportStatusBadgeConfig'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'

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

type AdminSuporteTicketsTableProps = {
  tickets: SupportTicket[]
  onOpenTicket: (ticket: SupportTicket) => void
}

/** Mesma tabela do SuporteMainPanel (UBT), com colunas extras do admin. */
export function AdminSuporteTicketsTable({
  tickets,
  onOpenTicket,
}: AdminSuporteTicketsTableProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col style={{ width: '9%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '21%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '3%' }} />
        </colgroup>
        <thead className="sticky top-0 z-10 bg-gray-50">
          <tr className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-5 py-3 text-left sm:px-6">Nº do chamado</th>
            <th className="px-3 py-3 text-center">Origem</th>
            <th className="px-3 py-3 text-center">Prefeitura</th>
            <th className="px-3 py-3 text-center">UBT</th>
            <th className="px-3 py-3 text-center">Assunto</th>
            <th className="px-3 py-3 text-center">Status</th>
            <th className="px-3 py-3 text-center">Prioridade</th>
            <th className="px-3 py-3 text-center">Última atualização</th>
            <th className="w-14 py-3 pl-3 pr-6 text-center sm:pr-8" aria-label="Ações" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-500 sm:px-6">
                Nenhum chamado encontrado com os filtros atuais.
              </td>
            </tr>
          ) : null}
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="cursor-pointer text-sm text-gray-700 transition hover:bg-gray-50/80"
              onClick={() => onOpenTicket(ticket)}
            >
              <td className="px-5 py-3.5 font-semibold text-gray-900 sm:px-6">
                {ticket.number}
              </td>
              <td className="px-3 py-3.5 text-center align-middle">
                <div className="flex justify-center">
                  {ticket.source ? (
                    <SituationStatusBadge
                      config={supportSourceBadgeConfig[ticket.source]}
                      widthClass={SUPPORT_SOURCE_BADGE_WIDTH}
                    />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </td>
              <td className="px-3 py-3.5 text-center align-middle">
                <span className="mx-auto block max-w-full truncate font-medium text-gray-800">
                  {ticket.municipalityName ?? '—'}
                </span>
              </td>
              <td className="px-3 py-3.5 text-center align-middle">
                <span className="mx-auto flex max-w-full items-center justify-center gap-1.5 font-medium text-gray-800">
                  <Building2
                    className="h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]"
                    strokeWidth={2}
                  />
                  <span className="min-w-0 truncate">{ticket.ubtName ?? '—'}</span>
                </span>
                {ticket.openedByName ? (
                  <span className="mx-auto mt-0.5 block max-w-full truncate text-xs text-gray-500">
                    {ticket.openedByName}
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-3.5 text-center align-middle font-medium text-gray-800">
                <span className="mx-auto line-clamp-2 max-w-full">{ticket.subject}</span>
              </td>
              <td className="px-3 py-3.5 text-center align-middle">
                <div className="flex justify-center">
                  <SituationStatusBadge
                    config={supportTicketStatusBadgeConfig[ticket.status]}
                    widthClass={SUPPORT_STATUS_BADGE_WIDTH}
                  />
                </div>
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
  )
}

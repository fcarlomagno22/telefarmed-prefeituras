import type { SupportTicketStatus } from '../../../data/suporteMock'
import type { SupportKpisResponse } from '../../../lib/services/admin/suporte'

const STATUS_UI: Record<
  SupportTicketStatus,
  { iconClass: string; dotClass: string }
> = {
  em_andamento: {
    iconClass: 'bg-sky-100 text-sky-600',
    dotClass: 'bg-sky-500',
  },
  aguardando_resposta: {
    iconClass: 'bg-amber-100 text-amber-600',
    dotClass: 'bg-amber-500',
  },
  respondido: {
    iconClass: 'bg-emerald-100 text-emerald-600',
    dotClass: 'bg-emerald-500',
  },
  encerrado: {
    iconClass: 'bg-gray-100 text-gray-500',
    dotClass: 'bg-gray-400',
  },
}

export function mapSupportKpisForSidebar(kpis: SupportKpisResponse) {
  return {
    statusSummary: kpis.statusSummary.map((item) => ({
      ...item,
      ...(STATUS_UI[item.key] ?? STATUS_UI.em_andamento),
    })),
    priorityDistribution: kpis.priorityDistribution,
    monthlyTrend: kpis.monthlyTrend,
    monthlyTotal: kpis.total,
    awaitingCount: kpis.awaitingCount,
    unreadSupportMessagesCount: kpis.unreadSupportMessagesCount ?? 0,
  }
}

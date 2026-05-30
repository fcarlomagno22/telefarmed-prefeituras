import type {
  SupportPrioritySlice,
  SupportTicket,
  SupportTicketSource,
  SupportTicketStatus,
} from './suporteMock'
import { prefeituraSupportTickets } from './prefeituraSuporteMock'
import { supportTickets } from './suporteMock'

function withSource(
  tickets: SupportTicket[],
  source: SupportTicketSource,
  municipalityName: string,
): SupportTicket[] {
  return tickets.map((ticket) => ({
    ...ticket,
    source,
    municipalityName: ticket.municipalityName ?? municipalityName,
  }))
}

const ubtTicketsForAdmin = supportTickets.map((ticket) => ({
  ...ticket,
  municipalityName: 'Brasília',
  ubtName: 'UBT Centro Histórico',
  openedByName: ticket.messages.find((message) => message.author === 'operator')?.authorName,
  openedByRole: 'Operadora',
}))

export const adminSupportTickets: SupportTicket[] = [
  ...withSource(ubtTicketsForAdmin, 'ubt', 'Brasília'),
  ...withSource(
    prefeituraSupportTickets.map((ticket) => ({
      ...ticket,
      id: `admin-${ticket.id}`,
    })),
    'prefeitura',
    'Brasília',
  ),
].sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate, 'pt-BR'))

export const adminSupportAwaitingCount = adminSupportTickets.filter(
  (ticket) => ticket.status === 'aguardando_resposta',
).length

export const adminSupportOpenCount = adminSupportTickets.filter(
  (ticket) => ticket.status !== 'encerrado',
).length

export const adminSupportStatusSummary = (
  ['em_andamento', 'aguardando_resposta', 'respondido', 'encerrado'] as const
).map((key) => {
  const labels: Record<SupportTicketStatus, { label: string; iconClass: string; dotClass: string }> =
    {
      em_andamento: {
        label: 'Em andamento',
        iconClass: 'bg-sky-100 text-sky-600',
        dotClass: 'bg-sky-500',
      },
      aguardando_resposta: {
        label: 'Aguardando resposta',
        iconClass: 'bg-amber-100 text-amber-600',
        dotClass: 'bg-amber-500',
      },
      respondido: {
        label: 'Respondidos',
        iconClass: 'bg-emerald-100 text-emerald-600',
        dotClass: 'bg-emerald-500',
      },
      encerrado: {
        label: 'Encerrados',
        iconClass: 'bg-gray-100 text-gray-500',
        dotClass: 'bg-gray-400',
      },
    }
  const config = labels[key]
  return {
    key,
    label: config.label,
    count: adminSupportTickets.filter((ticket) => ticket.status === key).length,
    iconClass: config.iconClass,
    dotClass: config.dotClass,
  }
})

export const adminSupportPriorityDistribution: SupportPrioritySlice[] = [
  {
    key: 'alta',
    label: 'Alta',
    percent: Math.round(
      (adminSupportTickets.filter((t) => t.priority === 'alta').length /
        adminSupportTickets.length) *
        100,
    ),
    count: adminSupportTickets.filter((t) => t.priority === 'alta').length,
    gradientFrom: '#f87171',
    gradientTo: '#ef4444',
  },
  {
    key: 'media',
    label: 'Média',
    percent: Math.round(
      (adminSupportTickets.filter((t) => t.priority === 'media').length /
        adminSupportTickets.length) *
        100,
    ),
    count: adminSupportTickets.filter((t) => t.priority === 'media').length,
    gradientFrom: '#fb923c',
    gradientTo: '#f97316',
  },
  {
    key: 'baixa',
    label: 'Baixa',
    percent: Math.round(
      (adminSupportTickets.filter((t) => t.priority === 'baixa').length /
        adminSupportTickets.length) *
        100,
    ),
    count: adminSupportTickets.filter((t) => t.priority === 'baixa').length,
    gradientFrom: '#4ade80',
    gradientTo: '#22c55e',
  },
]

export const adminSupportMonthlyTrend = [
  { label: '01/05', count: 1 },
  { label: '05/05', count: 1 },
  { label: '09/05', count: 1 },
  { label: '13/05', count: 2 },
  { label: '17/05', count: 3 },
  { label: '19/05', count: 5 },
]

export const adminSupportPagination = {
  pageSize: 10,
  total: adminSupportTickets.length,
}

export const adminSupportSourceLabels: Record<SupportTicketSource, string> = {
  ubt: 'UBT',
  prefeitura: 'Prefeitura',
  profissional: 'Profissional',
}

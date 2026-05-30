import { brand } from '../config/brand'
import type { SupportPrioritySlice, SupportTicket } from './suporteMock'

const openedByName = brand.profissionalOperatorName
const openedByRole = 'Médica'

export const profissionalSupportTickets: SupportTicket[] = [
  {
    id: 'pr1',
    number: '#CH-6102',
    subject: 'Videochamada trava ao iniciar consulta',
    status: 'em_andamento',
    priority: 'alta',
    lastUpdate: '28/05/2026 15:20',
    openedAt: '28/05/2026 14:05',
    category: 'Teleatendimento',
    source: 'profissional',
    openedByName,
    openedByRole,
    messages: [
      {
        id: 'm1',
        author: 'operator',
        authorName: openedByName,
        body: 'Ao clicar em Consultar na fila, a câmera não inicia e a tela fica em “Conectando…”.',
        sentAt: '28/05/2026 14:05',
      },
      {
        id: 'm2',
        author: 'support',
        authorName: 'Suporte Telefarmed',
        body: 'Recebemos seu chamado. Você está usando Chrome ou Edge? O problema ocorre com todos os pacientes da fila?',
        sentAt: '28/05/2026 15:20',
      },
    ],
  },
  {
    id: 'pr2',
    number: '#CH-6088',
    subject: 'Receita não conclui assinatura digital',
    status: 'aguardando_resposta',
    priority: 'alta',
    lastUpdate: '27/05/2026 11:42',
    openedAt: '27/05/2026 10:18',
    category: 'Teleatendimento',
    source: 'profissional',
    openedByName,
    openedByRole,
    messages: [
      {
        id: 'm1',
        author: 'operator',
        authorName: openedByName,
        body: 'Após preencher a receita e clicar em Assinar, o sistema retorna erro genérico e não gera o PDF.',
        sentAt: '27/05/2026 10:18',
      },
      {
        id: 'm2',
        author: 'support',
        authorName: 'Suporte Telefarmed',
        body: 'Verificamos o certificado. Por favor, confirme se o token A3 está conectado e tente novamente em uma aba anônima.',
        sentAt: '27/05/2026 11:42',
      },
    ],
  },
  {
    id: 'pr3',
    number: '#CH-6051',
    subject: 'Plantão de amanhã não aparece na agenda',
    status: 'respondido',
    priority: 'media',
    lastUpdate: '26/05/2026 18:30',
    openedAt: '26/05/2026 09:00',
    category: 'Agenda de consultas',
    source: 'profissional',
    openedByName,
    openedByRole,
    messages: [
      {
        id: 'm1',
        author: 'operator',
        authorName: openedByName,
        body: 'Fui designada para o plantão de 29/05 mas o dia não aparece no calendário do painel profissional.',
        sentAt: '26/05/2026 09:00',
      },
      {
        id: 'm3',
        author: 'support',
        authorName: 'Suporte Telefarmed',
        body: 'A escala foi republicada. Atualize a página (Ctrl+F5) e confira se o plantão aparece em Agenda.',
        sentAt: '26/05/2026 18:30',
      },
    ],
  },
  {
    id: 'pr4',
    number: '#CH-6019',
    subject: 'Valor do plantão divergente no extrato',
    status: 'em_andamento',
    priority: 'media',
    lastUpdate: '25/05/2026 16:10',
    openedAt: '25/05/2026 08:45',
    category: 'Relatórios',
    source: 'profissional',
    openedByName,
    openedByRole,
    messages: [
      {
        id: 'm1',
        author: 'operator',
        authorName: openedByName,
        body: 'O plantão de 24/05 consta com valor menor do que o acordado no contrato de prestação.',
        sentAt: '25/05/2026 08:45',
      },
      {
        id: 'm2',
        author: 'support',
        authorName: 'Suporte Telefarmed',
        body: 'Encaminhamos ao financeiro. Envie o ID do plantão (visível em Financeiro) para cruzarmos com a escala.',
        sentAt: '25/05/2026 16:10',
      },
    ],
  },
  {
    id: 'pr5',
    number: '#CH-5980',
    subject: 'Erro ao encerrar plantão no painel',
    status: 'encerrado',
    priority: 'baixa',
    lastUpdate: '22/05/2026 20:05',
    openedAt: '22/05/2026 19:30',
    category: 'Interface do sistema',
    source: 'profissional',
    openedByName,
    openedByRole,
    messages: [
      {
        id: 'm1',
        author: 'operator',
        authorName: openedByName,
        body: 'Ao clicar em Encerrar plantão, o modal confirma mas a fila continua ativa.',
        sentAt: '22/05/2026 19:30',
      },
      {
        id: 'm2',
        author: 'support',
        authorName: 'Suporte Telefarmed',
        body: 'Correção aplicada no encerramento de plantão. Chamado encerrado — obrigado pelo retorno.',
        sentAt: '22/05/2026 20:05',
      },
    ],
  },
]

function countByStatus(status: SupportTicket['status']) {
  return profissionalSupportTickets.filter((ticket) => ticket.status === status).length
}

function countByPriority(priority: SupportTicket['priority']) {
  return profissionalSupportTickets.filter((ticket) => ticket.priority === priority).length
}

const totalTickets = profissionalSupportTickets.length

export const profissionalSupportStatusSummary = [
  {
    key: 'em_andamento' as const,
    label: 'Em andamento',
    count: countByStatus('em_andamento'),
    iconClass: 'bg-sky-100 text-sky-600',
    dotClass: 'bg-sky-500',
  },
  {
    key: 'aguardando_resposta' as const,
    label: 'Aguardando resposta',
    count: countByStatus('aguardando_resposta'),
    iconClass: 'bg-amber-100 text-amber-600',
    dotClass: 'bg-amber-500',
  },
  {
    key: 'respondido' as const,
    label: 'Respondidos',
    count: countByStatus('respondido'),
    iconClass: 'bg-emerald-100 text-emerald-600',
    dotClass: 'bg-emerald-500',
  },
  {
    key: 'encerrado' as const,
    label: 'Encerrados',
    count: countByStatus('encerrado'),
    iconClass: 'bg-gray-100 text-gray-500',
    dotClass: 'bg-gray-400',
  },
]

export const profissionalSupportPriorityDistribution: SupportPrioritySlice[] = [
  {
    key: 'alta',
    label: 'Alta',
    percent: Math.round((countByPriority('alta') / totalTickets) * 100),
    count: countByPriority('alta'),
    gradientFrom: '#f87171',
    gradientTo: '#ef4444',
  },
  {
    key: 'media',
    label: 'Média',
    percent: Math.round((countByPriority('media') / totalTickets) * 100),
    count: countByPriority('media'),
    gradientFrom: '#fb923c',
    gradientTo: '#f97316',
  },
  {
    key: 'baixa',
    label: 'Baixa',
    percent: Math.round((countByPriority('baixa') / totalTickets) * 100),
    count: countByPriority('baixa'),
    gradientFrom: '#4ade80',
    gradientTo: '#22c55e',
  },
]

export const profissionalSupportMonthlyTrend = [
  { label: '01/05', count: 0 },
  { label: '05/05', count: 0 },
  { label: '09/05', count: 0 },
  { label: '13/05', count: 0 },
  { label: '17/05', count: 0 },
  { label: '21/05', count: 1 },
  { label: '25/05', count: 1 },
  { label: '28/05', count: 3 },
]

export const profissionalSupportPagination = {
  pageSize: 10,
  total: profissionalSupportTickets.length,
}

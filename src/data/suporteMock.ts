export type SupportTicketStatus =
  | 'em_andamento'
  | 'aguardando_resposta'
  | 'respondido'
  | 'encerrado'

export type SupportTicketPriority = 'alta' | 'media' | 'baixa'

export type SupportMessageAttachment = {
  id: string
  name: string
  type: 'pdf' | 'image'
  url: string
  size: number
}

export type SupportMessageDeletedSnapshot = {
  body: string
  editedAt?: string
  attachments?: SupportMessageAttachment[]
}

export type SupportMessageDeliveryStatus = 'pending' | 'sent' | 'failed'

export type SupportMessage = {
  id: string
  author: 'operator' | 'support'
  authorName: string
  body: string
  sentAt: string
  editedAt?: string
  deleted?: boolean
  deletedSnapshot?: SupportMessageDeletedSnapshot
  attachments?: SupportMessageAttachment[]
  /** Estado local de envio otimista (não persiste no servidor). */
  deliveryStatus?: SupportMessageDeliveryStatus
}

export type SupportTicketSource = 'ubt' | 'prefeitura' | 'profissional'

export type SupportTicket = {
  id: string
  number: string
  subject: string
  status: SupportTicketStatus
  priority: SupportTicketPriority
  lastUpdate: string
  openedAt: string
  category: string
  messages: SupportMessage[]
  /** Canal de abertura — visão central Telefarmed. */
  source?: SupportTicketSource
  /** Prefeitura contratante — visão central e municipal. */
  municipalityName?: string
  /** Preenchido na visão municipal — unidade que abriu o chamado. */
  ubtId?: string
  ubtName?: string
  openedByName?: string
  openedByRole?: string
}

export const supportTickets: SupportTicket[] = [
  {
    id: '1',
    number: '#CH-5821',
    subject: 'Erro ao iniciar teleatendimento',
    status: 'em_andamento',
    priority: 'alta',
    lastUpdate: '19/05/2026 21:40',
    openedAt: '19/05/2026 18:12',
    category: 'Teleatendimento',
    messages: [
      {
        id: 'm1',
        author: 'operator',
        authorName: 'Juliana Silva',
        body: 'Ao clicar em iniciar atendimento, a tela fica em branco e não abre a videochamada.',
        sentAt: '19/05/2026 18:12',
      },
      {
        id: 'm2',
        author: 'support',
        authorName: 'Suporte Telefarmed',
        body: 'Olá! Recebemos seu chamado. Pode informar se o problema ocorre em todos os pacientes ou apenas em um caso específico?',
        sentAt: '19/05/2026 19:05',
      },
      {
        id: 'm3',
        author: 'operator',
        authorName: 'Juliana Silva',
        body: 'Acontece em todos os atendimentos desde ontem à tarde.',
        sentAt: '19/05/2026 21:40',
      },
    ],
  },
  {
    id: '2',
    number: '#CH-5814',
    subject: 'Tela de espera não carrega',
    status: 'aguardando_resposta',
    priority: 'media',
    lastUpdate: '19/05/2026 19:51',
    openedAt: '19/05/2026 14:30',
    category: 'Interface do sistema',
    messages: [
      {
        id: 'm1',
        author: 'operator',
        authorName: 'Juliana Silva',
        body: 'A sala de espera fica carregando indefinidamente após o cadastro do paciente.',
        sentAt: '19/05/2026 14:30',
      },
      {
        id: 'm2',
        author: 'support',
        authorName: 'Suporte Telefarmed',
        body: 'Verificamos o ambiente. Por favor, tente atualizar a página com Ctrl+F5 e nos informe se o problema persiste.',
        sentAt: '19/05/2026 17:20',
      },
    ],
  },
  {
    id: '3',
    number: '#CH-5798',
    subject: 'Erro ao exportar relatório em PDF',
    status: 'respondido',
    priority: 'baixa',
    lastUpdate: '18/05/2026 23:28',
    openedAt: '18/05/2026 09:15',
    category: 'Relatórios',
    messages: [
      {
        id: 'm1',
        author: 'operator',
        authorName: 'Juliana Silva',
        body: 'Ao clicar em exportar relatório da unidade, o sistema exibe erro e não gera o PDF.',
        sentAt: '18/05/2026 09:15',
      },
      {
        id: 'm3',
        author: 'support',
        authorName: 'Suporte Telefarmed',
        body: 'Correção aplicada na geração de PDF. Atualize a página e tente exportar novamente.',
        sentAt: '18/05/2026 23:28',
      },
    ],
  },
  {
    id: '4',
    number: '#CH-5762',
    subject: 'Câmera desconecta durante consulta',
    status: 'em_andamento',
    priority: 'alta',
    lastUpdate: '18/05/2026 10:02',
    openedAt: '17/05/2026 16:45',
    category: 'Teleatendimento',
    messages: [
      {
        id: 'm1',
        author: 'operator',
        authorName: 'Juliana Silva',
        body: 'A câmera desliga sozinha após cerca de 5 minutos na videochamada do sistema.',
        sentAt: '17/05/2026 16:45',
      },
      {
        id: 'm2',
        author: 'support',
        authorName: 'Suporte Telefarmed',
        body: 'Estamos analisando os logs da videochamada no sistema. Você usa Chrome ou Edge?',
        sentAt: '18/05/2026 10:02',
      },
    ],
  },
  {
    id: '5',
    number: '#CH-5701',
    subject: 'Atualizar cadastro de operador no sistema',
    status: 'encerrado',
    priority: 'media',
    lastUpdate: '15/05/2026 22:18',
    openedAt: '14/05/2026 11:00',
    category: 'Usuários e permissões',
    messages: [
      {
        id: 'm1',
        author: 'operator',
        authorName: 'Juliana Silva',
        body: 'Preciso alterar o e-mail do operador responsável pelo Terminal no painel.',
        sentAt: '14/05/2026 11:00',
      },
      {
        id: 'm2',
        author: 'support',
        authorName: 'Suporte Telefarmed',
        body: 'Cadastro do operador atualizado no sistema. Chamado encerrado.',
        sentAt: '15/05/2026 22:18',
      },
    ],
  },
]

export const supportStatusSummary = [
  {
    key: 'em_andamento' as const,
    label: 'Em andamento',
    count: 2,
    iconClass: 'bg-sky-100 text-sky-600',
    dotClass: 'bg-sky-500',
  },
  {
    key: 'aguardando_resposta' as const,
    label: 'Aguardando resposta',
    count: 1,
    iconClass: 'bg-amber-100 text-amber-600',
    dotClass: 'bg-amber-500',
  },
  {
    key: 'respondido' as const,
    label: 'Respondidos',
    count: 1,
    iconClass: 'bg-emerald-100 text-emerald-600',
    dotClass: 'bg-emerald-500',
  },
  {
    key: 'encerrado' as const,
    label: 'Encerrados',
    count: 1,
    iconClass: 'bg-gray-100 text-gray-500',
    dotClass: 'bg-gray-400',
  },
]

export type SupportPrioritySlice = {
  key: SupportTicketPriority
  label: string
  percent: number
  count: number
  gradientFrom: string
  gradientTo: string
}

export const supportPriorityDistribution: SupportPrioritySlice[] = [
  {
    key: 'alta',
    label: 'Alta',
    percent: 40,
    count: 2,
    gradientFrom: '#f87171',
    gradientTo: '#ef4444',
  },
  {
    key: 'media',
    label: 'Média',
    percent: 40,
    count: 2,
    gradientFrom: '#fb923c',
    gradientTo: '#f97316',
  },
  {
    key: 'baixa',
    label: 'Baixa',
    percent: 20,
    count: 1,
    gradientFrom: '#4ade80',
    gradientTo: '#22c55e',
  },
]

export const supportMonthlyTotal = 5

export const supportMonthlyTrend = [
  { label: '01/05', count: 0 },
  { label: '03/05', count: 0 },
  { label: '05/05', count: 1 },
  { label: '07/05', count: 0 },
  { label: '09/05', count: 0 },
  { label: '11/05', count: 1 },
  { label: '13/05', count: 0 },
  { label: '15/05', count: 1 },
  { label: '17/05', count: 1 },
  { label: '19/05', count: 2 },
]

export const supportPagination = {
  pageSize: 10,
  total: supportTickets.length,
}

/** Categorias exclusivas do software de gestão e teleatendimento Telefarmed. */
export const supportTicketCategories = [
  'Teleatendimento',
  'Triagem e atendimento',
  'Agenda de consultas',
  'Consultas e histórico',
  'Cadastro de pacientes',
  'Usuários e permissões',
  'Relatórios',
  'Login e acesso',
  'Interface do sistema',
  'Outros',
] as const

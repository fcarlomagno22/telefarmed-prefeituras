export const PROFISSIONAL_SUPORTE_TOUR_STORAGE_KEY = 'telefarmed:profissional-suporte-tour-v1'

/** Chamado usado nos passos de abrir detalhe e conversa. */
export const PROFISSIONAL_SUPORTE_TOUR_DEMO_TICKET_ID = 'pr1'

export type ProfissionalSuporteTourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center'

export type ProfissionalSuporteTourAdvanceOn = 'next' | 'target-click' | 'next-or-target-click'

export type ProfissionalSuporteTourStep = {
  id: string
  title: string
  body: string
  hint?: string
  nextLabel?: string
  target?: string
  placement?: ProfissionalSuporteTourPlacement
  advanceOn?: ProfissionalSuporteTourAdvanceOn
  skipIfMissing?: boolean
}

export const profissionalSuporteTourFirstVisitBody =
  'Na sua primeira visita, pedimos que conclua este tour — são poucos minutos e ajudam você a abrir chamados e acompanhar respostas com mais segurança. Depois, você pode rever quando quiser pelo botão "Ver tour guiado" no topo da página.'

export const profissionalSuporteTourSteps: ProfissionalSuporteTourStep[] = [
  {
    id: 'welcome',
    title: 'Suporte',
    body: 'Aqui você abre chamados sobre escala, pagamentos, teleatendimento ou o painel profissional, e acompanha o andamento de cada solicitação.',
    placement: 'center',
  },
  {
    id: 'main-panel',
    target: 'suporte-main-panel',
    title: 'Seus chamados',
    body: 'Lista de solicitações abertas por você, com busca, filtros e paginação.',
    placement: 'bottom',
  },
  {
    id: 'search',
    target: 'suporte-search',
    title: 'Buscar chamado',
    body: 'Encontre um chamado pelo número, assunto, categoria ou palavras-chave.',
    placement: 'bottom',
  },
  {
    id: 'status-filter',
    target: 'suporte-status-filter',
    title: 'Filtrar por status',
    body: 'Restrinja a lista por situação: em andamento, aguardando resposta, respondido ou encerrado.',
    placement: 'bottom',
  },
  {
    id: 'new-ticket-btn',
    target: 'suporte-new-ticket-btn',
    title: 'Abrir novo chamado',
    body: 'Use este botão para registrar um problema ou dúvida. Informe categoria, prioridade, assunto e descrição.',
    hint: 'Toque no botão ou clique em Ver formulário',
    nextLabel: 'Ver formulário',
    placement: 'left',
    advanceOn: 'next-or-target-click',
  },
  {
    id: 'new-ticket-drawer',
    target: 'suporte-new-ticket-drawer',
    title: 'Formulário do chamado',
    body: 'Preencha categoria, prioridade, assunto e descrição. Você pode anexar arquivos antes de enviar.',
    placement: 'top',
    skipIfMissing: true,
  },
  {
    id: 'table',
    target: 'suporte-table',
    title: 'Tabela de chamados',
    body: 'Cada linha mostra número, assunto, status, prioridade e última atualização.',
    placement: 'top',
  },
  {
    id: 'view-ticket',
    target: 'suporte-view-ticket',
    title: 'Ver conversa',
    body: 'Clique na linha ou na seta para abrir o histórico de mensagens com a equipe de suporte.',
    hint: 'Toque na linha destacada ou clique em Ver conversa',
    nextLabel: 'Ver conversa',
    placement: 'left',
    advanceOn: 'next-or-target-click',
    skipIfMissing: true,
  },
  {
    id: 'ticket-drawer',
    target: 'suporte-ticket-drawer',
    title: 'Detalhe do chamado',
    body: 'Cabeçalho com número, assunto, status, categoria e informações do chamado.',
    placement: 'top',
    skipIfMissing: true,
  },
  {
    id: 'ticket-drawer-chat',
    target: 'suporte-ticket-drawer-chat',
    title: 'Conversa com o suporte',
    body: 'Histórico de mensagens trocadas. Você pode responder, favoritar mensagens e anexar arquivos enquanto o chamado estiver aberto.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'pagination',
    target: 'suporte-pagination',
    title: 'Paginação',
    body: 'Navegue entre páginas quando houver muitos chamados na lista.',
    placement: 'top',
  },
  {
    id: 'sidebar',
    target: 'suporte-sidebar',
    title: 'Resumo e gráficos',
    body: 'Indicadores dos seus chamados: status, prioridade e volume no mês.',
    placement: 'left',
  },
  {
    id: 'status-summary',
    target: 'suporte-status-summary',
    title: 'Chamados por status',
    body: 'Contagem rápida de chamados em andamento, aguardando resposta, respondidos e encerrados.',
    placement: 'left',
  },
  {
    id: 'priority-chart',
    target: 'suporte-priority-chart',
    title: 'Prioridade',
    body: 'Distribuição entre prioridade alta, média e baixa nos seus chamados.',
    placement: 'left',
  },
  {
    id: 'done',
    title: 'Pronto!',
    body: 'Abra chamados sempre que precisar e acompanhe as respostas por aqui. Estamos à disposição!',
    placement: 'center',
  },
]

export const profissionalSuporteNewTicketTourStepIds = new Set(['new-ticket-drawer'])

export const profissionalSuporteTicketDrawerTourStepIds = new Set([
  'ticket-drawer',
  'ticket-drawer-chat',
])

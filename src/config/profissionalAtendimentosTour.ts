export const PROFISSIONAL_ATENDIMENTOS_TOUR_STORAGE_KEY =
  'telefarmed:profissional-atendimentos-tour-v1'
export const PROFISSIONAL_ATENDIMENTOS_TOUR_INVITE_STORAGE_KEY =
  'telefarmed:profissional-atendimentos-tour-invite-v1'

/** Registro usado nos passos do drawer (notas, docs, anexos). */
export const PROFISSIONAL_ATENDIMENTOS_TOUR_DEMO_RECORD_ID = 'pat-003'

export const PROFISSIONAL_ATENDIMENTOS_TOUR_PREVIEW_ATTACHMENT_ID = 'up-2'

export type ProfissionalAtendimentosTourPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center'

export type ProfissionalAtendimentosTourAdvanceOn =
  | 'next'
  | 'target-click'
  | 'next-or-target-click'

export type ProfissionalAtendimentosTourStep = {
  id: string
  title: string
  body: string
  hint?: string
  nextLabel?: string
  target?: string
  placement?: ProfissionalAtendimentosTourPlacement
  advanceOn?: ProfissionalAtendimentosTourAdvanceOn
  skipIfMissing?: boolean
}


export const profissionalAtendimentosTourSteps: ProfissionalAtendimentosTourStep[] = [
  {
    id: 'welcome',
    title: 'Seus atendimentos',
    body: 'Aqui você consulta o histórico de teleconsultas, filtra resultados, abre detalhes de cada consulta e acompanha gráficos do período.',
    placement: 'center',
  },
  {
    id: 'main-panel',
    target: 'atendimentos-main-panel',
    title: 'Histórico de consultas',
    body: 'Lista de atendimentos no período selecionado, com contagem total no topo.',
    placement: 'bottom',
  },
  {
    id: 'filters',
    target: 'atendimentos-filters',
    title: 'Busca e filtros',
    body: 'Busque por paciente, ID ou anotação. Filtre por status (concluído ou interrompido) e escolha o intervalo de datas.',
    placement: 'bottom',
  },
  {
    id: 'table',
    target: 'atendimentos-table',
    title: 'Tabela de resultados',
    body: 'Cada linha mostra data, paciente, idade, duração, documentos emitidos/recebidos e status do atendimento.',
    placement: 'top',
  },
  {
    id: 'view-details',
    target: 'atendimentos-view-details-btn',
    title: 'Detalhes do atendimento',
    body: 'Toque no ícone do olho para abrir o prontuário da consulta, documentos enviados e arquivos que o paciente mandou.',
    hint: 'Toque no botão destacado ou clique em Ver detalhes',
    nextLabel: 'Ver detalhes',
    placement: 'left',
    advanceOn: 'next-or-target-click',
    skipIfMissing: true,
  },
  {
    id: 'drawer-header',
    target: 'atendimentos-drawer-header',
    title: 'Cabeçalho do prontuário',
    body: 'Nome do paciente, ID do atendimento, especialidade, duração e situação da consulta.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'drawer-notes',
    target: 'atendimentos-drawer-notes',
    title: 'Anotações do prontuário',
    body: 'Notas clínicas registradas neste atendimento. Anexos de foto ou PDF aparecem nos chips abaixo de cada anotação.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'full-record-btn',
    target: 'atendimentos-full-record-btn',
    title: 'Histórico completo',
    body: 'Abre todas as anotações anteriores do paciente na especialidade — útil para contexto em consultas de retorno.',
    hint: 'Toque em Ver histórico completo ou clique em Abrir histórico',
    nextLabel: 'Abrir histórico',
    placement: 'left',
    advanceOn: 'next-or-target-click',
    skipIfMissing: true,
  },
  {
    id: 'full-record-modal',
    target: 'atendimentos-full-record-modal',
    title: 'Modal de histórico',
    body: 'Linha do tempo com todas as anotações. Você pode abrir anexos de cada registro sem sair desta tela.',
    placement: 'center',
    skipIfMissing: true,
  },
  {
    id: 'drawer-sent',
    target: 'atendimentos-drawer-sent',
    title: 'Documentos enviados',
    body: 'Receitas, atestados, pedidos de exame e orientações que você emitiu neste atendimento. Use o ícone de download para salvar.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'drawer-received',
    target: 'atendimentos-drawer-received',
    title: 'Arquivos recebidos',
    body: 'Exames, fotos e PDFs enviados pelo paciente antes ou durante a consulta. Toque em um item para visualizar.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'attachment-preview-btn',
    target: 'atendimentos-attachment-preview-btn',
    title: 'Visualizar anexo',
    body: 'Abre o arquivo em tela cheia — dá para ampliar imagens e PDFs com zoom.',
    hint: 'Toque no arquivo destacado ou clique em Visualizar',
    nextLabel: 'Visualizar',
    placement: 'left',
    advanceOn: 'next-or-target-click',
    skipIfMissing: true,
  },
  {
    id: 'attachment-viewer',
    target: 'atendimentos-attachment-viewer',
    title: 'Leitor de anexos',
    body: 'Use os botões de zoom ou Ctrl + scroll. Feche pelo X quando terminar de analisar o arquivo.',
    placement: 'center',
    skipIfMissing: true,
  },
  {
    id: 'charts-sidebar',
    target: 'atendimentos-charts-sidebar',
    title: 'Painel analítico',
    body: 'Os gráficos à direita acompanham os filtros da lista — quanto mais você filtra, mais os números refletem o recorte.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'summary-card',
    target: 'atendimentos-summary-card',
    title: 'Resumo do período',
    body: 'Total de atendimentos, concluídos, interrompidos, tempo médio e volume de documentos emitidos e recebidos.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'weekly-trend',
    target: 'atendimentos-weekly-trend',
    title: 'Tendência semanal',
    body: 'Consultas por semana no intervalo filtrado. Passe o mouse nos pontos para ver o detalhe.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'docs-donut',
    target: 'atendimentos-docs-donut',
    title: 'Tipos de documento',
    body: 'Distribuição de receitas, atestados, pedidos e orientações emitidos no período.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'specialty-bars',
    target: 'atendimentos-specialty-bars',
    title: 'Por especialidade',
    body: 'Quantos atendimentos você fez em cada especialidade no recorte atual.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'age-bands',
    target: 'atendimentos-age-bars',
    title: 'Faixa etária',
    body: 'Perfil de idade dos pacientes atendidos — ajuda a enxergar o público do período.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'weekday-bars',
    target: 'atendimentos-weekday-bars',
    title: 'Dias da semana',
    body: 'Em quais dias da semana você mais atendeu no período selecionado.',
    placement: 'left',
    skipIfMissing: true,
  },
  {
    id: 'pagination',
    target: 'atendimentos-pagination',
    title: 'Paginação',
    body: 'Navegue entre páginas quando houver muitos registros. A contagem embaixo mostra o intervalo exibido.',
    placement: 'top',
    skipIfMissing: true,
  },
  {
    id: 'done',
    title: 'Pronto!',
    body: 'Use esta página para revisar consultas, baixar documentos e acompanhar sua produção. Bom trabalho!',
    placement: 'center',
  },
]

export const profissionalAtendimentosDrawerTourStepIds = new Set([
  'drawer-header',
  'drawer-notes',
  'full-record-btn',
  'full-record-modal',
  'drawer-sent',
  'drawer-received',
  'attachment-preview-btn',
  'attachment-viewer',
])

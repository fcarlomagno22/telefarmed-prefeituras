export type AuditCriticalityLevel = 'all' | 'critical' | 'high' | 'medium' | 'low'

export type AuditLogsAdvancedFilters = {
  startDate: string
  endDate: string
  timeFrom: string
  timeTo: string
  userId: string
  userType: string
  unit: string
  prefeitura: string
  ubt: string
  platform: string
  action: string
  eventCategory: string
  criticality: AuditCriticalityLevel
  module: string
  affectedResource: string
  resourceId: string
  ipDevice: string
  serverResponse: string
  httpCode: string
  outcome: string
}

export const defaultAuditLogsAdvancedFilters = (): AuditLogsAdvancedFilters => ({
  startDate: '2026-05-12',
  endDate: '2026-05-19',
  timeFrom: '00:00',
  timeTo: '23:59',
  userId: '',
  userType: '',
  unit: '',
  prefeitura: '',
  ubt: '',
  platform: '',
  action: '',
  eventCategory: '',
  criticality: 'all',
  module: '',
  affectedResource: '',
  resourceId: '',
  ipDevice: '',
  serverResponse: '',
  httpCode: '',
  outcome: '',
})

export const auditLogsAdvancedFilterOptions = {
  users: [
    { value: '', label: 'Selecione um usuário' },
    { value: 'juliana', label: 'Juliana Silva' },
    { value: 'carlos', label: 'Carlos Mendes' },
    { value: 'ana', label: 'Ana Paula Costa' },
    { value: 'roberto', label: 'Roberto Alves' },
  ],
  userTypes: [
    { value: '', label: 'Todos os tipos' },
    { value: 'administrador', label: 'Administrador' },
    { value: 'operador', label: 'Operador' },
    { value: 'editor', label: 'Editor' },
    { value: 'visualizador', label: 'Visualizador' },
  ],
  units: [
    { value: '', label: 'Todas as unidades' },
    { value: 'ubt-central', label: 'UBT Central' },
    { value: 'ubt-norte', label: 'UBT Norte' },
    { value: 'ubt-sul', label: 'UBT Sul' },
  ],
  platforms: [
    { value: '', label: 'Todas as plataformas' },
    { value: 'admin', label: 'Admin Telefarmed' },
    { value: 'prefeitura', label: 'Prefeitura' },
    { value: 'ubt', label: 'UBT' },
    { value: 'atendimento', label: 'Atendimento' },
  ],
  prefeituras: [
    { value: '', label: 'Todas as prefeituras' },
    { value: 'brasilia', label: 'Brasília' },
    { value: 'campinas', label: 'Campinas' },
    { value: 'sorocaba', label: 'Sorocaba' },
  ],
  ubts: [
    { value: '', label: 'Todas as UBTs' },
    { value: 'ubt-centro-historico', label: 'UBT Centro Histórico' },
    { value: 'ubt-norte-i', label: 'UBT Norte I' },
    { value: 'ubt-taguatinga', label: 'UBT Taguatinga' },
    { value: 'ubt-sul', label: 'UBT Sul' },
  ],
  actions: [
    { value: '', label: 'Todas as ações' },
    { value: 'view', label: 'Visualizações' },
    { value: 'create', label: 'Criações' },
    { value: 'update', label: 'Atualizações' },
    { value: 'delete', label: 'Exclusões' },
    { value: 'auth', label: 'Autenticação' },
  ],
  eventCategories: [
    { value: '', label: 'Todas as categorias' },
    { value: 'access', label: 'Acesso e sessão' },
    { value: 'data', label: 'Dados e registros' },
    { value: 'security', label: 'Segurança' },
    { value: 'export', label: 'Exportação' },
  ],
  modules: [
    { value: '', label: 'Todos os módulos' },
    { value: 'pacientes', label: 'Pacientes' },
    { value: 'consultas', label: 'Consultas' },
    { value: 'agenda', label: 'Agenda' },
    { value: 'usuarios', label: 'Usuários da rede' },
    { value: 'credenciais', label: 'Credenciais de acesso' },
    { value: 'relatorios', label: 'Relatórios' },
  ],
  serverResponses: [
    { value: '', label: 'Todos os resultados' },
    { value: '2xx', label: 'Sucesso (2xx)' },
    { value: '4xx', label: 'Erro do cliente (4xx)' },
    { value: '5xx', label: 'Erro do servidor (5xx)' },
  ],
  outcomes: [
    { value: '', label: 'Todos' },
    { value: 'success', label: 'Sucesso' },
    { value: 'failure', label: 'Falha' },
  ],
} as const

export const auditCriticalityOptions = [
  { value: 'all' as const, label: 'Todas' },
  { value: 'critical' as const, label: 'Crítico' },
  { value: 'high' as const, label: 'Alto' },
  { value: 'medium' as const, label: 'Médio' },
  { value: 'low' as const, label: 'Baixo' },
]

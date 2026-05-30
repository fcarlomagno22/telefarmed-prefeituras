import type { AuditLogPlatform } from '../types/auditLogScope'

export type AuditLogSeverity = 'info' | 'warning' | 'critical'

export type AuditLogActionTone = 'create' | 'view' | 'update' | 'delete' | 'auth'

export type AuditLogEntry = {
  id: string
  platform: AuditLogPlatform
  /** Município cliente; null em ações globais do painel admin. */
  prefeituraName: string | null
  /** Unidade UBT vinculada ao evento; null quando não se aplica. */
  ubtName: string | null
  severity: AuditLogSeverity
  dateTime: string
  userName: string
  userRole: string
  actionLabel: string
  httpMethod: string
  actionTone: AuditLogActionTone
  moduleName: string
  pagePath: string
  resourceLabel: string
  resourceId: string
  serverResponse: string
  serverResponseTone: 'success' | 'error'
  ipAddress: string
  deviceInfo: string
}

export const AUDIT_LOGS_PAGINATION_TOTAL_UBT = 2847
export const AUDIT_LOGS_PAGINATION_TOTAL_PREFEITURA = 6124
export const AUDIT_LOGS_PAGINATION_TOTAL_ADMIN = 18420

const PAGE_SIZE = 10

export const auditLogsPagination = {
  total: AUDIT_LOGS_PAGINATION_TOTAL_UBT,
  pageSize: PAGE_SIZE,
  totalPages: Math.ceil(AUDIT_LOGS_PAGINATION_TOTAL_UBT / PAGE_SIZE),
} as const

export const auditLogsSummaryUbt = {
  totalEvents: 2847,
  totalEventsTrend: '+12.5% vs ontem',
  activeUsers: 8,
  activeUsersTrend: '+2 vs ontem',
  criticalEvents: 23,
  criticalEventsTrend: '+5 vs ontem',
  successRate: '98.7%',
  successRateTrend: '+1.2% vs ontem',
  peakHourLabel: '14h',
  peakHourCount: 186,
} as const

export const auditLogsSummaryPrefeitura = {
  totalEvents: 6124,
  totalEventsTrend: '+9.8% vs ontem',
  activeUsers: 24,
  activeUsersTrend: '+4 vs ontem',
  criticalEvents: 41,
  criticalEventsTrend: '+7 vs ontem',
  successRate: '98.2%',
  successRateTrend: '+0.8% vs ontem',
  peakHourLabel: '15h',
  peakHourCount: 312,
} as const

export const auditLogsSummaryAdmin = {
  totalEvents: 18420,
  totalEventsTrend: '+18.4% vs ontem',
  activeUsers: 127,
  activeUsersTrend: '+19 vs ontem',
  criticalEvents: 89,
  criticalEventsTrend: '+12 vs ontem',
  successRate: '97.9%',
  successRateTrend: '+0.5% vs ontem',
  peakHourLabel: '14h',
  peakHourCount: 842,
} as const

/** @deprecated Use auditLogsSummaryUbt ou getAuditLogsDataset */
export const auditLogsSummary = auditLogsSummaryUbt

export const auditLogsHourlyActivityUbt = [
  { label: '0h', count: 72 },
  { label: '2h', count: 48 },
  { label: '4h', count: 35 },
  { label: '6h', count: 58 },
  { label: '8h', count: 124 },
  { label: '10h', count: 168 },
  { label: '12h', count: 152 },
  { label: '14h', count: 186 },
  { label: '16h', count: 174 },
  { label: '18h', count: 142 },
  { label: '20h', count: 118 },
  { label: '22h', count: 86 },
] as const

export const auditLogsHourlyActivityPrefeitura = [
  { label: '0h', count: 148 },
  { label: '2h', count: 102 },
  { label: '4h', count: 88 },
  { label: '6h', count: 124 },
  { label: '8h', count: 268 },
  { label: '10h', count: 342 },
  { label: '12h', count: 298 },
  { label: '14h', count: 312 },
  { label: '16h', count: 286 },
  { label: '18h', count: 244 },
  { label: '20h', count: 198 },
  { label: '22h', count: 164 },
] as const

export const auditLogsHourlyActivityAdmin = [
  { label: '0h', count: 412 },
  { label: '2h', count: 288 },
  { label: '4h', count: 224 },
  { label: '6h', count: 356 },
  { label: '8h', count: 724 },
  { label: '10h', count: 892 },
  { label: '12h', count: 812 },
  { label: '14h', count: 842 },
  { label: '16h', count: 798 },
  { label: '18h', count: 684 },
  { label: '20h', count: 548 },
  { label: '22h', count: 412 },
] as const

/** @deprecated Use auditLogsHourlyActivityUbt ou getAuditLogsDataset */
export const auditLogsHourlyActivity = auditLogsHourlyActivityUbt

export const auditLogsByTypeUbt = [
  { key: 'views', label: 'Visualizações', count: 1234, percent: 43.4, gradientFrom: '#38bdf8', gradientTo: '#2563eb' },
  { key: 'creates', label: 'Criações', count: 856, percent: 30.1, gradientFrom: '#34d399', gradientTo: '#059669' },
  { key: 'updates', label: 'Atualizações', count: 512, percent: 18.0, gradientFrom: '#fb923c', gradientTo: '#ea580c' },
  { key: 'deletes', label: 'Exclusões', count: 156, percent: 5.5, gradientFrom: '#f87171', gradientTo: '#dc2626' },
  { key: 'other', label: 'Outros', count: 89, percent: 3.1, gradientFrom: '#9ca3af', gradientTo: '#6b7280' },
] as const

export const auditLogsByTypePrefeitura = [
  { key: 'views', label: 'Visualizações', count: 2684, percent: 43.8, gradientFrom: '#38bdf8', gradientTo: '#2563eb' },
  { key: 'creates', label: 'Criações', count: 1824, percent: 29.8, gradientFrom: '#34d399', gradientTo: '#059669' },
  { key: 'updates', label: 'Atualizações', count: 1102, percent: 18.0, gradientFrom: '#fb923c', gradientTo: '#ea580c' },
  { key: 'deletes', label: 'Exclusões', count: 312, percent: 5.1, gradientFrom: '#f87171', gradientTo: '#dc2626' },
  { key: 'other', label: 'Outros', count: 202, percent: 3.3, gradientFrom: '#9ca3af', gradientTo: '#6b7280' },
] as const

export const auditLogsByTypeAdmin = [
  { key: 'views', label: 'Visualizações', count: 8124, percent: 44.1, gradientFrom: '#38bdf8', gradientTo: '#2563eb' },
  { key: 'creates', label: 'Criações', count: 5486, percent: 29.8, gradientFrom: '#34d399', gradientTo: '#059669' },
  { key: 'updates', label: 'Atualizações', count: 3312, percent: 18.0, gradientFrom: '#fb923c', gradientTo: '#ea580c' },
  { key: 'deletes', label: 'Exclusões', count: 986, percent: 5.4, gradientFrom: '#f87171', gradientTo: '#dc2626' },
  { key: 'other', label: 'Outros', count: 512, percent: 2.8, gradientFrom: '#9ca3af', gradientTo: '#6b7280' },
] as const

/** @deprecated Use auditLogsByTypeUbt ou getAuditLogsDataset */
export const auditLogsByType = auditLogsByTypeUbt

export const auditLogsCriticalBreakdownUbt = [
  { key: 'deletions', label: 'Exclusões realizadas', count: 12, trend: '+3 vs ontem' },
  { key: 'permissions', label: 'Falhas de permissão', count: 8, trend: '+2 vs ontem' },
  { key: 'system', label: 'Erros do sistema', count: 3, trend: '+1 vs ontem' },
] as const

export const auditLogsCriticalBreakdownPrefeitura = [
  { key: 'deletions', label: 'Exclusões realizadas', count: 18, trend: '+4 vs ontem' },
  { key: 'permissions', label: 'Falhas de permissão', count: 14, trend: '+3 vs ontem' },
  { key: 'system', label: 'Erros do sistema', count: 9, trend: '+2 vs ontem' },
] as const

export const auditLogsCriticalBreakdownAdmin = [
  { key: 'deletions', label: 'Exclusões realizadas', count: 34, trend: '+8 vs ontem' },
  { key: 'permissions', label: 'Falhas de permissão', count: 28, trend: '+6 vs ontem' },
  { key: 'system', label: 'Erros do sistema', count: 27, trend: '+4 vs ontem' },
] as const

/** @deprecated Use auditLogsCriticalBreakdownUbt ou getAuditLogsDataset */
export const auditLogsCriticalBreakdown = auditLogsCriticalBreakdownUbt

const baseFilterOptions = {
  users: [
    { value: '', label: 'Todos os usuários' },
    { value: 'juliana', label: 'Juliana Silva' },
    { value: 'carlos', label: 'Carlos Mendes' },
    { value: 'ana', label: 'Ana Paula Costa' },
    { value: 'roberto', label: 'Roberto Alves' },
    { value: 'fernanda', label: 'Fernanda Lima (Admin)' },
    { value: 'marcos', label: 'Marcos Oliveira (Prefeitura)' },
  ],
  actions: [
    { value: '', label: 'Todas as ações' },
    { value: 'view', label: 'Visualizações' },
    { value: 'create', label: 'Criações' },
    { value: 'update', label: 'Atualizações' },
    { value: 'delete', label: 'Exclusões' },
    { value: 'auth', label: 'Autenticação' },
  ],
  periods: [
    { value: '', label: 'Período' },
    { value: '24h', label: 'Últimas 24 horas' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: 'custom', label: 'Período personalizado' },
  ],
} as const

export const auditLogsFilterOptionsUbt = {
  ...baseFilterOptions,
  modules: [
    { value: '', label: 'Todos os módulos' },
    { value: 'pacientes', label: 'Pacientes' },
    { value: 'consultas', label: 'Consultas' },
    { value: 'agenda', label: 'Agenda' },
    { value: 'credenciais', label: 'Credenciais de acesso' },
    { value: 'relatorios', label: 'Relatórios' },
    { value: 'suporte', label: 'Suporte' },
  ],
} as const

export const auditLogsFilterOptionsPrefeitura = {
  ...baseFilterOptions,
  ubts: [
    { value: '', label: 'Todas as UBTs da rede' },
    { value: 'ubt-centro-historico', label: 'UBT Centro Histórico' },
    { value: 'ubt-norte-i', label: 'UBT Norte I' },
    { value: 'ubt-taguatinga', label: 'UBT Taguatinga' },
  ],
  modules: [
    { value: '', label: 'Todos os módulos' },
    { value: 'pacientes', label: 'Pacientes' },
    { value: 'consultas', label: 'Consultas' },
    { value: 'agenda', label: 'Agenda' },
    { value: 'usuarios', label: 'Usuários da rede' },
    { value: 'credenciais', label: 'Credenciais de acesso' },
    { value: 'contrato', label: 'Contrato municipal' },
    { value: 'relatorios', label: 'Relatórios' },
    { value: 'suporte', label: 'Suporte' },
  ],
} as const

export const auditLogPrefeituraFilterOptions = [
  { value: '', label: 'Todas as prefeituras' },
  { value: 'brasilia', label: 'Brasília' },
  { value: 'campinas', label: 'Campinas' },
  { value: 'sorocaba', label: 'Sorocaba' },
] as const

export const auditLogUbtFilterOptions = [
  { value: '', label: 'Todas as UBTs' },
  { value: 'ubt-centro-historico', label: 'UBT Centro Histórico' },
  { value: 'ubt-norte-i', label: 'UBT Norte I' },
  { value: 'ubt-taguatinga', label: 'UBT Taguatinga' },
  { value: 'ubt-sul', label: 'UBT Sul' },
] as const

export const auditLogsFilterOptionsAdmin = {
  ...baseFilterOptions,
  prefeituras: auditLogPrefeituraFilterOptions,
  ubts: auditLogUbtFilterOptions,
  modules: [
    { value: '', label: 'Todos os módulos' },
    { value: 'clientes', label: 'Clientes' },
    { value: 'pessoas', label: 'Pessoas' },
    { value: 'monitor', label: 'Monitor operacional' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'notificacoes', label: 'Notificações' },
    { value: 'suporte', label: 'Suporte' },
    { value: 'credenciais', label: 'Credenciais' },
    { value: 'consultas', label: 'Consultas (UBT)' },
    { value: 'usuarios', label: 'Usuários (Prefeitura)' },
    { value: 'contrato', label: 'Contrato (Prefeitura)' },
    { value: 'atendimento', label: 'Atendimento' },
  ],
} as const

/** @deprecated Use auditLogsFilterOptionsUbt ou getAuditLogsDataset */
export const auditLogsFilterOptions = auditLogsFilterOptionsUbt

export const auditLogsAllEntries: AuditLogEntry[] = [
  {
    id: 'adm-1',
    platform: 'admin',
    prefeituraName: 'Campinas',
    ubtName: null,
    severity: 'critical',
    dateTime: '27/05/2026 23:01:12',
    userName: 'Fernanda Lima',
    userRole: 'Admin Telefarmed',
    actionLabel: 'Alteração de credencial de cliente',
    httpMethod: 'PUT',
    actionTone: 'update',
    moduleName: 'Credenciais',
    pagePath: '/admin/credenciais/42',
    resourceLabel: 'Gestor: Prefeitura de Campinas',
    resourceId: 'ID: 42',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '201.48.12.88',
    deviceInfo: 'Chrome / macOS',
  },
  {
    id: 'pref-1',
    platform: 'prefeitura',
    prefeituraName: 'Brasília',
    ubtName: null,
    severity: 'warning',
    dateTime: '27/05/2026 22:58:44',
    userName: 'Marcos Oliveira',
    userRole: 'Gestor municipal',
    actionLabel: 'Liberação de dados sensíveis (LGPD)',
    httpMethod: 'POST',
    actionTone: 'view',
    moduleName: 'Usuários da rede',
    pagePath: '/prefeitura/usuarios/881',
    resourceLabel: 'Servidor: Ana Souza',
    resourceId: 'CPF mascarado',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '177.89.44.12',
    deviceInfo: 'Edge / Windows',
  },
  {
    id: 'ubt-1',
    platform: 'ubt',
    prefeituraName: 'Brasília',
    ubtName: 'UBT Centro Histórico',
    severity: 'critical',
    dateTime: '27/05/2026 22:52:41',
    userName: 'Juliana Silva',
    userRole: 'Operador UBT',
    actionLabel: 'Exclusão de paciente',
    httpMethod: 'DELETE',
    actionTone: 'delete',
    moduleName: 'Pacientes',
    pagePath: '/ubt/pacientes/123',
    resourceLabel: 'Paciente: João da Silva',
    resourceId: 'ID: 123',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '192.168.1.45',
    deviceInfo: 'Chrome / Windows',
  },
  {
    id: 'atd-1',
    platform: 'atendimento',
    prefeituraName: 'Campinas',
    ubtName: 'UBT Sul',
    severity: 'info',
    dateTime: '27/05/2026 22:49:18',
    userName: 'Dr. Ricardo Mendes',
    userRole: 'Médico',
    actionLabel: 'Encerramento de atendimento',
    httpMethod: 'POST',
    actionTone: 'update',
    moduleName: 'Atendimento',
    pagePath: '/atendimento/AT-9021/medico',
    resourceLabel: 'Consulta: AT-9021',
    resourceId: 'Paciente: Maria Santos',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '10.42.0.18',
    deviceInfo: 'Safari / iPadOS',
  },
  {
    id: 'adm-2',
    platform: 'admin',
    prefeituraName: 'Sorocaba',
    ubtName: null,
    severity: 'info',
    dateTime: '27/05/2026 22:46:02',
    userName: 'Fernanda Lima',
    userRole: 'Admin Telefarmed',
    actionLabel: 'Cadastro de novo cliente',
    httpMethod: 'POST',
    actionTone: 'create',
    moduleName: 'Clientes',
    pagePath: '/admin/clientes/novo',
    resourceLabel: 'Prefeitura de Sorocaba',
    resourceId: 'ID: PM-SOR',
    serverResponse: '201 Created',
    serverResponseTone: 'success',
    ipAddress: '201.48.12.88',
    deviceInfo: 'Chrome / macOS',
  },
  {
    id: 'ubt-2',
    platform: 'ubt',
    prefeituraName: 'Brasília',
    ubtName: 'UBT Taguatinga',
    severity: 'warning',
    dateTime: '27/05/2026 22:42:12',
    userName: 'Carlos Mendes',
    userRole: 'Administrador UBT',
    actionLabel: 'Atualização de consulta',
    httpMethod: 'PUT',
    actionTone: 'update',
    moduleName: 'Consultas',
    pagePath: '/ubt/consultas/456',
    resourceLabel: 'Consulta: #456',
    resourceId: 'ID: 456',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '192.168.1.12',
    deviceInfo: 'Firefox / macOS',
  },
  {
    id: 'pref-2',
    platform: 'prefeitura',
    prefeituraName: 'Brasília',
    ubtName: null,
    severity: 'info',
    dateTime: '27/05/2026 22:38:55',
    userName: 'Marcos Oliveira',
    userRole: 'Gestor municipal',
    actionLabel: 'Exportação de relatório municipal',
    httpMethod: 'GET',
    actionTone: 'view',
    moduleName: 'Relatórios',
    pagePath: '/prefeitura/relatorios/utilizacao',
    resourceLabel: 'Relatório: Utilização da rede',
    resourceId: 'Período: 30 dias',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '177.89.44.12',
    deviceInfo: 'Edge / Windows',
  },
  {
    id: 'adm-3',
    platform: 'admin',
    prefeituraName: 'Campinas',
    ubtName: null,
    severity: 'warning',
    dateTime: '27/05/2026 22:35:40',
    userName: 'Paulo Ribeiro',
    userRole: 'Financeiro Telefarmed',
    actionLabel: 'Ajuste de faturamento',
    httpMethod: 'PATCH',
    actionTone: 'update',
    moduleName: 'Financeiro',
    pagePath: '/admin/financeiro/faturas/118',
    resourceLabel: 'Fatura: Prefeitura de Campinas',
    resourceId: 'Ref: MAIO/2026',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '201.48.12.90',
    deviceInfo: 'Chrome / Windows',
  },
  {
    id: 'ubt-3',
    platform: 'ubt',
    prefeituraName: 'Brasília',
    ubtName: 'UBT Centro Histórico',
    severity: 'info',
    dateTime: '27/05/2026 22:31:44',
    userName: 'Ana Paula Costa',
    userRole: 'Operador UBT',
    actionLabel: 'Tentativa de exclusão negada',
    httpMethod: 'DELETE',
    actionTone: 'delete',
    moduleName: 'Credenciais',
    pagePath: '/ubt/credenciais/12',
    resourceLabel: 'Usuário: Admin Sistema',
    resourceId: 'ID: 12',
    serverResponse: '403 Forbidden',
    serverResponseTone: 'error',
    ipAddress: '192.168.1.33',
    deviceInfo: 'Chrome / Windows',
  },
  {
    id: 'pref-3',
    platform: 'prefeitura',
    prefeituraName: 'Brasília',
    ubtName: null,
    severity: 'info',
    dateTime: '27/05/2026 22:28:09',
    userName: 'Luciana Ferreira',
    userRole: 'Operador municipal',
    actionLabel: 'Visualização de contrato',
    httpMethod: 'GET',
    actionTone: 'view',
    moduleName: 'Contrato municipal',
    pagePath: '/prefeitura/contrato',
    resourceLabel: 'Contrato Telefarmed',
    resourceId: 'Vigência: 2026',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '177.89.44.18',
    deviceInfo: 'Chrome / Windows',
  },
  {
    id: 'adm-4',
    platform: 'admin',
    prefeituraName: null,
    ubtName: null,
    severity: 'info',
    dateTime: '27/05/2026 22:24:18',
    userName: 'Fernanda Lima',
    userRole: 'Admin Telefarmed',
    actionLabel: 'Envio de notificação em massa',
    httpMethod: 'POST',
    actionTone: 'create',
    moduleName: 'Notificações',
    pagePath: '/admin/notificacoes',
    resourceLabel: 'Broadcast: Manutenção programada',
    resourceId: 'Destinos: 12 prefeituras',
    serverResponse: '202 Accepted',
    serverResponseTone: 'success',
    ipAddress: '201.48.12.88',
    deviceInfo: 'Chrome / macOS',
  },
  {
    id: 'ubt-4',
    platform: 'ubt',
    prefeituraName: 'Campinas',
    ubtName: 'UBT Sul',
    severity: 'info',
    dateTime: '27/05/2026 22:20:33',
    userName: 'Roberto Alves',
    userRole: 'Visualizador UBT',
    actionLabel: 'Exportação de relatório',
    httpMethod: 'GET',
    actionTone: 'view',
    moduleName: 'Relatórios',
    pagePath: '/ubt/relatorios/consultas',
    resourceLabel: 'Relatório: Consultas',
    resourceId: 'Período: 30 dias',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '10.0.0.8',
    deviceInfo: 'Edge / Windows',
  },
  {
    id: 'adm-5',
    platform: 'admin',
    prefeituraName: null,
    ubtName: null,
    severity: 'info',
    dateTime: '27/05/2026 22:16:05',
    userName: 'Fernanda Lima',
    userRole: 'Admin Telefarmed',
    actionLabel: 'Login no painel admin',
    httpMethod: 'POST',
    actionTone: 'auth',
    moduleName: 'Autenticação',
    pagePath: '/admin/login',
    resourceLabel: 'Sessão: Fernanda Lima',
    resourceId: 'Token: f9a2…',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '201.48.12.88',
    deviceInfo: 'Chrome / macOS',
  },
  {
    id: 'pref-4',
    platform: 'prefeitura',
    prefeituraName: 'Brasília',
    ubtName: 'UBT Norte I',
    severity: 'warning',
    dateTime: '27/05/2026 22:12:44',
    userName: 'Marcos Oliveira',
    userRole: 'Gestor municipal',
    actionLabel: 'Abertura de chamado de suporte',
    httpMethod: 'POST',
    actionTone: 'create',
    moduleName: 'Suporte',
    pagePath: '/prefeitura/suporte',
    resourceLabel: 'Chamado: Integração UBT Norte',
    resourceId: 'TK-4402',
    serverResponse: '201 Created',
    serverResponseTone: 'success',
    ipAddress: '177.89.44.12',
    deviceInfo: 'Edge / Windows',
  },
  {
    id: 'ubt-5',
    platform: 'ubt',
    prefeituraName: 'Brasília',
    ubtName: 'UBT Centro Histórico',
    severity: 'info',
    dateTime: '27/05/2026 22:08:22',
    userName: 'Juliana Silva',
    userRole: 'Operador UBT',
    actionLabel: 'Login no sistema UBT',
    httpMethod: 'POST',
    actionTone: 'auth',
    moduleName: 'Autenticação',
    pagePath: '/ubt/login',
    resourceLabel: 'Sessão: Juliana Silva',
    resourceId: 'Token: a8f3…',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '192.168.1.45',
    deviceInfo: 'Chrome / Windows',
  },
  {
    id: 'adm-6',
    platform: 'admin',
    prefeituraName: 'Sorocaba',
    ubtName: null,
    severity: 'critical',
    dateTime: '27/05/2026 22:04:11',
    userName: 'Paulo Ribeiro',
    userRole: 'Financeiro Telefarmed',
    actionLabel: 'Tentativa de estorno sem permissão',
    httpMethod: 'POST',
    actionTone: 'delete',
    moduleName: 'Financeiro',
    pagePath: '/admin/financeiro/faturas/118/estorno',
    resourceLabel: 'Fatura: Prefeitura de Sorocaba',
    resourceId: 'Ref: MAIO/2026',
    serverResponse: '403 Forbidden',
    serverResponseTone: 'error',
    ipAddress: '201.48.12.90',
    deviceInfo: 'Chrome / Windows',
  },
  {
    id: 'atd-2',
    platform: 'atendimento',
    prefeituraName: 'Campinas',
    ubtName: 'UBT Sul',
    severity: 'info',
    dateTime: '27/05/2026 22:00:48',
    userName: 'Paciente (autoatendimento)',
    userRole: 'Paciente',
    actionLabel: 'Entrada na sala de espera',
    httpMethod: 'POST',
    actionTone: 'create',
    moduleName: 'Atendimento',
    pagePath: '/sala-de-espera',
    resourceLabel: 'Fila: Teleconsulta',
    resourceId: 'AT-9022',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '189.44.102.33',
    deviceInfo: 'Chrome / Android',
  },
]

/** Primeira página UBT — retrocompatível com imports antigos. */
export const auditLogsPageOne: AuditLogEntry[] = auditLogsAllEntries.filter(
  (entry) => entry.platform === 'ubt' || entry.platform === 'atendimento',
).slice(0, PAGE_SIZE)

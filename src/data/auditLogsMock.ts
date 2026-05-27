export type AuditLogSeverity = 'info' | 'warning' | 'critical'

export type AuditLogActionTone = 'create' | 'view' | 'update' | 'delete' | 'auth'

export type AuditLogEntry = {
  id: string
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

export const auditLogsPagination = {
  total: 2847,
  pageSize: 10,
  totalPages: 285,
} as const

export const auditLogsSummary = {
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

/** Volume de eventos a cada 2 horas — últimas 24h (gráfico de área). */
export const auditLogsHourlyActivity = [
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

export const auditLogsByType = [
  {
    key: 'views',
    label: 'Visualizações',
    count: 1234,
    percent: 43.4,
    gradientFrom: '#38bdf8',
    gradientTo: '#2563eb',
  },
  {
    key: 'creates',
    label: 'Criações',
    count: 856,
    percent: 30.1,
    gradientFrom: '#34d399',
    gradientTo: '#059669',
  },
  {
    key: 'updates',
    label: 'Atualizações',
    count: 512,
    percent: 18.0,
    gradientFrom: '#fb923c',
    gradientTo: '#ea580c',
  },
  {
    key: 'deletes',
    label: 'Exclusões',
    count: 156,
    percent: 5.5,
    gradientFrom: '#f87171',
    gradientTo: '#dc2626',
  },
  {
    key: 'other',
    label: 'Outros',
    count: 89,
    percent: 3.1,
    gradientFrom: '#9ca3af',
    gradientTo: '#6b7280',
  },
] as const

export const auditLogsCriticalBreakdown = [
  {
    key: 'deletions',
    label: 'Exclusões realizadas',
    count: 12,
    trend: '+3 vs ontem',
  },
  {
    key: 'permissions',
    label: 'Falhas de permissão',
    count: 8,
    trend: '+2 vs ontem',
  },
  {
    key: 'system',
    label: 'Erros do sistema',
    count: 3,
    trend: '+1 vs ontem',
  },
] as const

export const auditLogsFilterOptions = {
  users: [
    { value: '', label: 'Todos os usuários' },
    { value: 'juliana', label: 'Juliana Silva' },
    { value: 'carlos', label: 'Carlos Mendes' },
    { value: 'ana', label: 'Ana Paula Costa' },
    { value: 'roberto', label: 'Roberto Alves' },
  ],
  actions: [
    { value: '', label: 'Todas as ações' },
    { value: 'view', label: 'Visualizações' },
    { value: 'create', label: 'Criações' },
    { value: 'update', label: 'Atualizações' },
    { value: 'delete', label: 'Exclusões' },
    { value: 'auth', label: 'Autenticação' },
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
  periods: [
    { value: '', label: 'Período' },
    { value: '24h', label: 'Últimas 24 horas' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: 'custom', label: 'Período personalizado' },
  ],
} as const

/** Primeira página exibida na tabela — dados fixos conforme o layout de referência. */
export const auditLogsPageOne: AuditLogEntry[] = [
  {
    id: '1',
    severity: 'critical',
    dateTime: '19/05/2026 22:52:41',
    userName: 'Juliana Silva',
    userRole: 'Operador',
    actionLabel: 'Exclusão de paciente',
    httpMethod: 'DELETE',
    actionTone: 'delete',
    moduleName: 'Pacientes',
    pagePath: '/pacientes/123',
    resourceLabel: 'Paciente: João da Silva',
    resourceId: 'ID: 123',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '192.168.1.45',
    deviceInfo: 'Chrome / Windows',
  },
  {
    id: '2',
    severity: 'warning',
    dateTime: '19/05/2026 22:48:12',
    userName: 'Carlos Mendes',
    userRole: 'Administrador',
    actionLabel: 'Atualização de consulta',
    httpMethod: 'PUT',
    actionTone: 'update',
    moduleName: 'Consultas',
    pagePath: '/consultas/456',
    resourceLabel: 'Consulta: #456',
    resourceId: 'ID: 456',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '192.168.1.12',
    deviceInfo: 'Firefox / macOS',
  },
  {
    id: '3',
    severity: 'info',
    dateTime: '19/05/2026 22:45:03',
    userName: 'Ana Paula Costa',
    userRole: 'Operador',
    actionLabel: 'Visualização de paciente',
    httpMethod: 'GET',
    actionTone: 'view',
    moduleName: 'Pacientes',
    pagePath: '/pacientes/789',
    resourceLabel: 'Paciente: Maria Santos',
    resourceId: 'ID: 789',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '192.168.1.33',
    deviceInfo: 'Chrome / Windows',
  },
  {
    id: '4',
    severity: 'info',
    dateTime: '19/05/2026 22:41:27',
    userName: 'Juliana Silva',
    userRole: 'Operador',
    actionLabel: 'Criação de paciente',
    httpMethod: 'POST',
    actionTone: 'create',
    moduleName: 'Pacientes',
    pagePath: '/pacientes/novo',
    resourceLabel: 'Paciente: Pedro Oliveira',
    resourceId: 'ID: 790',
    serverResponse: '201 Created',
    serverResponseTone: 'success',
    ipAddress: '192.168.1.45',
    deviceInfo: 'Chrome / Windows',
  },
  {
    id: '5',
    severity: 'info',
    dateTime: '19/05/2026 22:38:55',
    userName: 'Roberto Alves',
    userRole: 'Visualizador',
    actionLabel: 'Login no sistema',
    httpMethod: 'POST',
    actionTone: 'auth',
    moduleName: 'Autenticação',
    pagePath: '/login',
    resourceLabel: 'Sessão: Roberto Alves',
    resourceId: 'Token: a8f3…',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '10.0.0.8',
    deviceInfo: 'Edge / Windows',
  },
  {
    id: '6',
    severity: 'warning',
    dateTime: '19/05/2026 22:35:18',
    userName: 'Carlos Mendes',
    userRole: 'Administrador',
    actionLabel: 'Logout do sistema',
    httpMethod: 'POST',
    actionTone: 'update',
    moduleName: 'Autenticação',
    pagePath: '/logout',
    resourceLabel: 'Sessão: Carlos Mendes',
    resourceId: 'Token: b2c1…',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '192.168.1.12',
    deviceInfo: 'Firefox / macOS',
  },
  {
    id: '7',
    severity: 'critical',
    dateTime: '19/05/2026 22:31:44',
    userName: 'Ana Paula Costa',
    userRole: 'Operador',
    actionLabel: 'Tentativa de exclusão',
    httpMethod: 'DELETE',
    actionTone: 'delete',
    moduleName: 'Credenciais',
    pagePath: '/credenciais/12',
    resourceLabel: 'Usuário: Admin Sistema',
    resourceId: 'ID: 12',
    serverResponse: '403 Forbidden',
    serverResponseTone: 'error',
    ipAddress: '192.168.1.33',
    deviceInfo: 'Chrome / Windows',
  },
  {
    id: '8',
    severity: 'info',
    dateTime: '19/05/2026 22:28:09',
    userName: 'Juliana Silva',
    userRole: 'Operador',
    actionLabel: 'Visualização de agenda',
    httpMethod: 'GET',
    actionTone: 'view',
    moduleName: 'Agenda',
    pagePath: '/agenda',
    resourceLabel: 'Agenda do dia',
    resourceId: 'Data: 19/05/2026',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '192.168.1.45',
    deviceInfo: 'Chrome / Windows',
  },
  {
    id: '9',
    severity: 'warning',
    dateTime: '19/05/2026 22:24:51',
    userName: 'Carlos Mendes',
    userRole: 'Administrador',
    actionLabel: 'Atualização de credencial',
    httpMethod: 'PUT',
    actionTone: 'update',
    moduleName: 'Credenciais',
    pagePath: '/credenciais/8',
    resourceLabel: 'Usuário: Ana Paula Costa',
    resourceId: 'ID: 8',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '192.168.1.12',
    deviceInfo: 'Firefox / macOS',
  },
  {
    id: '10',
    severity: 'info',
    dateTime: '19/05/2026 22:20:33',
    userName: 'Roberto Alves',
    userRole: 'Visualizador',
    actionLabel: 'Exportação de relatório',
    httpMethod: 'GET',
    actionTone: 'view',
    moduleName: 'Relatórios',
    pagePath: '/relatorios/consultas',
    resourceLabel: 'Relatório: Consultas',
    resourceId: 'Período: 30 dias',
    serverResponse: '200 OK',
    serverResponseTone: 'success',
    ipAddress: '10.0.0.8',
    deviceInfo: 'Edge / Windows',
  },
]

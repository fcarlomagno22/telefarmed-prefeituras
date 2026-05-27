import {
  AlertTriangle,
  Building2,
  ClipboardList,
  DollarSign,
  Monitor,
  Timer,
} from 'lucide-react'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'
import type { PrefeituraSlaStatus } from './prefeituraDashboardMock'

export type AdminMunicipalityHealth = 'green' | 'yellow' | 'red'
export type AdminContractFilterKey = 'all' | 'active' | 'expiring' | 'suspended'
export type AdminStateKey = 'all' | 'df' | 'go' | 'mg' | 'sp'

export type AdminNocCategory =
  | 'contract_expiring'
  | 'package_overflow'
  | 'ubt_offline'
  | 'high_queue'
  | 'integration_failure'
  | 'security'

export type AdminNocPriority = 'critical' | 'high' | 'medium'
export type AdminNocStatus = 'open' | 'in_progress' | 'resolved'

export type AdminNocHistoryEntry = {
  at: string
  actor: string
  note: string
}

export type AdminNocIncident = {
  id: string
  title: string
  municipality: string
  municipalityId: string
  category: AdminNocCategory
  priority: AdminNocPriority
  status: AdminNocStatus
  assignee: string | null
  team: string
  internalSlaHours: number
  internalSlaBreached: boolean
  detectedAt: string
  timeAgo: string
  description: string
  impact: string
  recommendedAction: string
  history: AdminNocHistoryEntry[]
}

export type AdminMunicipalityRow = {
  id: string
  name: string
  state: string
  stateKey: Exclude<AdminStateKey, 'all'>
  contractStatus: Exclude<AdminContractFilterKey, 'all'>
  health: AdminMunicipalityHealth
  consultationsToday: number
  consultationsMonth: number
  packageUsagePercent: number
  sla: PrefeituraSlaStatus
  terminalsOnline: number
  terminalsOffline: number
  terminalsMaintenance: number
  terminalsTotal: number
  openNocCount: number
  revenuePackage: number
  revenueAvulso: number
}

export const adminDashboardFilterOptions = {
  period: [
    { value: 'hoje', label: 'Hoje' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
  ],
  state: [
    { value: 'all', label: 'Todos os estados' },
    { value: 'df', label: 'Distrito Federal' },
    { value: 'go', label: 'Goiás' },
    { value: 'mg', label: 'Minas Gerais' },
    { value: 'sp', label: 'São Paulo' },
  ],
  contract: [
    { value: 'all', label: 'Todos os contratos' },
    { value: 'active', label: 'Ativos' },
    { value: 'expiring', label: 'Vencendo (90 dias)' },
    { value: 'suspended', label: 'Suspensos' },
  ],
  health: [
    { value: 'all', label: 'Todos os semáforos' },
    { value: 'green', label: 'Verde — operação normal' },
    { value: 'yellow', label: 'Amarelo — atenção' },
    { value: 'red', label: 'Vermelho — crítico' },
  ],
} as const

export function getAdminMunicipalityStateFilterOptions(
  rows: AdminMunicipalityRow[] = adminMunicipalities,
) {
  const stateKeys = new Set(rows.map((row) => row.stateKey))
  return adminDashboardFilterOptions.state.filter(
    (option) => option.value === 'all' || stateKeys.has(option.value as AdminStateKey),
  )
}

export const adminNocCategoryLabels: Record<AdminNocCategory, string> = {
  contract_expiring: 'Contrato vencendo',
  package_overflow: 'Estouro de pacote',
  ubt_offline: 'UBT offline',
  high_queue: 'Fila alta',
  integration_failure: 'Falha de integração',
  security: 'Segurança',
}

export const adminNocTeams = [
  'NOC Plataforma',
  'Implantação',
  'Integrações',
  'Segurança da Informação',
  'Suporte N2',
] as const

export const adminMunicipalities: AdminMunicipalityRow[] = [
  {
    id: 'mun-bsb',
    name: 'Brasília',
    state: 'DF',
    stateKey: 'df',
    contractStatus: 'active',
    health: 'green',
    consultationsToday: 412,
    consultationsMonth: 9840,
    packageUsagePercent: 72,
    sla: 'normal',
    terminalsOnline: 28,
    terminalsOffline: 1,
    terminalsMaintenance: 1,
    terminalsTotal: 30,
    openNocCount: 1,
    revenuePackage: 186_400,
    revenueAvulso: 12_800,
  },
  {
    id: 'mun-anapolis',
    name: 'Anápolis',
    state: 'GO',
    stateKey: 'go',
    contractStatus: 'expiring',
    health: 'yellow',
    consultationsToday: 186,
    consultationsMonth: 4210,
    packageUsagePercent: 91,
    sla: 'atencao',
    terminalsOnline: 14,
    terminalsOffline: 2,
    terminalsMaintenance: 0,
    terminalsTotal: 16,
    openNocCount: 2,
    revenuePackage: 92_100,
    revenueAvulso: 18_400,
  },
  {
    id: 'mun-uberlandia',
    name: 'Uberlândia',
    state: 'MG',
    stateKey: 'mg',
    contractStatus: 'active',
    health: 'green',
    consultationsToday: 298,
    consultationsMonth: 7120,
    packageUsagePercent: 68,
    sla: 'normal',
    terminalsOnline: 22,
    terminalsOffline: 0,
    terminalsMaintenance: 2,
    terminalsTotal: 24,
    openNocCount: 0,
    revenuePackage: 142_600,
    revenueAvulso: 9_200,
  },
  {
    id: 'mun-campinas',
    name: 'Campinas',
    state: 'SP',
    stateKey: 'sp',
    contractStatus: 'active',
    health: 'yellow',
    consultationsToday: 524,
    consultationsMonth: 12_480,
    packageUsagePercent: 88,
    sla: 'atencao',
    terminalsOnline: 34,
    terminalsOffline: 3,
    terminalsMaintenance: 1,
    terminalsTotal: 38,
    openNocCount: 3,
    revenuePackage: 248_900,
    revenueAvulso: 31_600,
  },
  {
    id: 'mun-luziania',
    name: 'Luziânia',
    state: 'GO',
    stateKey: 'go',
    contractStatus: 'active',
    health: 'green',
    consultationsToday: 94,
    consultationsMonth: 2180,
    packageUsagePercent: 54,
    sla: 'normal',
    terminalsOnline: 8,
    terminalsOffline: 0,
    terminalsMaintenance: 0,
    terminalsTotal: 8,
    openNocCount: 0,
    revenuePackage: 48_200,
    revenueAvulso: 2_100,
  },
  {
    id: 'mun-betim',
    name: 'Betim',
    state: 'MG',
    stateKey: 'mg',
    contractStatus: 'suspended',
    health: 'red',
    consultationsToday: 12,
    consultationsMonth: 890,
    packageUsagePercent: 102,
    sla: 'critico',
    terminalsOnline: 3,
    terminalsOffline: 9,
    terminalsMaintenance: 2,
    terminalsTotal: 14,
    openNocCount: 4,
    revenuePackage: 18_400,
    revenueAvulso: 6_800,
  },
  {
    id: 'mun-guarulhos',
    name: 'Guarulhos',
    state: 'SP',
    stateKey: 'sp',
    contractStatus: 'active',
    health: 'green',
    consultationsToday: 356,
    consultationsMonth: 8640,
    packageUsagePercent: 61,
    sla: 'normal',
    terminalsOnline: 26,
    terminalsOffline: 1,
    terminalsMaintenance: 1,
    terminalsTotal: 28,
    openNocCount: 1,
    revenuePackage: 168_300,
    revenueAvulso: 7_400,
  },
  {
    id: 'mun-taguatinga',
    name: 'Taguatinga',
    state: 'DF',
    stateKey: 'df',
    contractStatus: 'expiring',
    health: 'red',
    consultationsToday: 228,
    consultationsMonth: 5420,
    packageUsagePercent: 97,
    sla: 'critico',
    terminalsOnline: 11,
    terminalsOffline: 4,
    terminalsMaintenance: 1,
    terminalsTotal: 16,
    openNocCount: 5,
    revenuePackage: 112_800,
    revenueAvulso: 24_900,
  },
]

export const adminNocIncidents: AdminNocIncident[] = [
  {
    id: 'noc-001',
    title: 'Contrato vence em 18 dias — renovação pendente',
    municipality: 'Anápolis',
    municipalityId: 'mun-anapolis',
    category: 'contract_expiring',
    priority: 'high',
    status: 'open',
    assignee: null,
    team: 'Implantação',
    internalSlaHours: 48,
    internalSlaBreached: false,
    detectedAt: '2026-05-26T08:12:00',
    timeAgo: 'há 2 h',
    description: 'Contrato municipal entra na janela de 90 dias sem aditivo assinado.',
    impact: 'Risco de bloqueio de novas consultas após o vencimento.',
    recommendedAction: 'Acionar jurídico e gestor do contrato para aditivo.',
    history: [
      { at: '26/05 08:12', actor: 'Sistema', note: 'Incidente aberto automaticamente.' },
    ],
  },
  {
    id: 'noc-002',
    title: 'Pacote mensal estourado (+2%)',
    municipality: 'Betim',
    municipalityId: 'mun-betim',
    category: 'package_overflow',
    priority: 'critical',
    status: 'in_progress',
    assignee: 'Marina Costa',
    team: 'NOC Plataforma',
    internalSlaHours: 4,
    internalSlaBreached: true,
    detectedAt: '2026-05-26T05:40:00',
    timeAgo: 'há 5 h',
    description: 'Consumo acima do limite contratado no ciclo atual.',
    impact: 'Consultas avulsas sendo faturadas; alerta ao gestor municipal.',
    recommendedAction: 'Validar aditivo de pacote ou travar novas agendas.',
    history: [
      { at: '26/05 05:40', actor: 'Sistema', note: 'Limite de pacote ultrapassado.' },
      { at: '26/05 06:15', actor: 'Marina Costa', note: 'Em tratamento com comercial.' },
    ],
  },
  {
    id: 'noc-003',
    title: 'UBT Centro offline há 42 min',
    municipality: 'Taguatinga',
    municipalityId: 'mun-taguatinga',
    category: 'ubt_offline',
    priority: 'critical',
    status: 'in_progress',
    assignee: 'Rafael Mendes',
    team: 'NOC Plataforma',
    internalSlaHours: 2,
    internalSlaBreached: true,
    detectedAt: '2026-05-26T09:48:00',
    timeAgo: 'há 42 min',
    description: 'Terminal sem heartbeat; fila local redirecionada.',
    impact: 'Pacientes em espera na unidade sem atendimento presencial.',
    recommendedAction: 'Contatar operador da UBT e verificar energia/rede.',
    history: [
      { at: '26/05 09:48', actor: 'Monitor', note: 'Heartbeat perdido.' },
      { at: '26/05 10:05', actor: 'Rafael Mendes', note: 'Tentativa de contato com UBT.' },
    ],
  },
  {
    id: 'noc-004',
    title: 'Fila agregada acima de 25 pacientes',
    municipality: 'Campinas',
    municipalityId: 'mun-campinas',
    category: 'high_queue',
    priority: 'high',
    status: 'open',
    assignee: 'Ana Souza',
    team: 'Suporte N2',
    internalSlaHours: 6,
    internalSlaBreached: false,
    detectedAt: '2026-05-26T10:15:00',
    timeAgo: 'há 15 min',
    description: 'Pico de demanda em clínica geral no turno da manhã.',
    impact: 'Tempo médio de espera projetado acima de 18 min.',
    recommendedAction: 'Solicitar reforço de plantão médico.',
    history: [{ at: '26/05 10:15', actor: 'Sistema', note: 'Limiar de fila ultrapassado.' }],
  },
  {
    id: 'noc-005',
    title: 'Falha na integração e-SUS (HTTP 503)',
    municipality: 'Brasília',
    municipalityId: 'mun-bsb',
    category: 'integration_failure',
    priority: 'medium',
    status: 'open',
    assignee: null,
    team: 'Integrações',
    internalSlaHours: 8,
    internalSlaBreached: false,
    detectedAt: '2026-05-26T09:02:00',
    timeAgo: 'há 1 h 28 min',
    description: 'Envio de fichas de atendimento com retentativas automáticas.',
    impact: 'Sincronização de prontuário atrasada; dados locais preservados.',
    recommendedAction: 'Verificar status do gateway municipal.',
    history: [{ at: '26/05 09:02', actor: 'Integrações', note: '3 falhas consecutivas registradas.' }],
  },
  {
    id: 'noc-006',
    title: 'Tentativas de login suspeitas (bloqueio automático)',
    municipality: 'Guarulhos',
    municipalityId: 'mun-guarulhos',
    category: 'security',
    priority: 'critical',
    status: 'resolved',
    assignee: 'Paulo Neri',
    team: 'Segurança da Informação',
    internalSlaHours: 1,
    internalSlaBreached: false,
    detectedAt: '2026-05-25T22:30:00',
    timeAgo: 'ontem',
    description: 'Múltiplas tentativas de credencial de operador em IP externo.',
    impact: 'Conta bloqueada; nenhum acesso indevido confirmado.',
    recommendedAction: 'Reset de senha e revisão de MFA do operador.',
    history: [
      { at: '25/05 22:30', actor: 'SIEM', note: 'Alerta de brute force.' },
      { at: '25/05 22:45', actor: 'Paulo Neri', note: 'Conta bloqueada e gestor notificado.' },
      { at: '26/05 08:00', actor: 'Paulo Neri', note: 'Incidente encerrado.' },
    ],
  },
  {
    id: 'noc-007',
    title: 'UBT Norte sem câmera — atendimento degradado',
    municipality: 'Campinas',
    municipalityId: 'mun-campinas',
    category: 'ubt_offline',
    priority: 'medium',
    status: 'open',
    assignee: null,
    team: 'NOC Plataforma',
    internalSlaHours: 12,
    internalSlaBreached: false,
    detectedAt: '2026-05-26T07:20:00',
    timeAgo: 'há 3 h',
    description: 'Periférico de vídeo indisponível; consultas em modo áudio.',
    impact: 'Triagem facial desabilitada na unidade.',
    recommendedAction: 'Agendar visita técnica ou troca de webcam.',
    history: [{ at: '26/05 07:20', actor: 'Monitor', note: 'Dispositivo de mídia offline.' }],
  },
  {
    id: 'noc-008',
    title: 'Pacote em 97% — risco de estouro em 48 h',
    municipality: 'Taguatinga',
    municipalityId: 'mun-taguatinga',
    category: 'package_overflow',
    priority: 'high',
    status: 'in_progress',
    assignee: 'Marina Costa',
    team: 'NOC Plataforma',
    internalSlaHours: 24,
    internalSlaBreached: false,
    detectedAt: '2026-05-26T06:00:00',
    timeAgo: 'há 4 h',
    description: 'Projeção de consumo indica estouro antes do fechamento do ciclo.',
    impact: 'Possível interrupção de agendas programadas.',
    recommendedAction: 'Antecipar negociação de aditivo com prefeitura.',
    history: [
      { at: '26/05 06:00', actor: 'Sistema', note: 'Alerta preditivo de pacote.' },
      { at: '26/05 08:30', actor: 'Marina Costa', note: 'E-mail enviado ao gestor municipal.' },
    ],
  },
]

export const adminPlatformHourlyBase = [
  { hour: '07h', value: 420 },
  { hour: '08h', value: 890 },
  { hour: '09h', value: 1240 },
  { hour: '10h', value: 1580 },
  { hour: '11h', value: 1420 },
  { hour: '12h', value: 980 },
  { hour: '13h', value: 760 },
  { hour: '14h', value: 1100 },
  { hour: '15h', value: 1320 },
  { hour: '16h', value: 1180 },
  { hour: '17h', value: 940 },
  { hour: '18h', value: 520 },
]

export const adminDashboardKpiBase: KpiStatCardItem[] = [
  {
    label: 'Prefeituras ativas',
    value: '24',
    suffix: '2 vencendo · 1 suspensa',
    icon: Building2,
    iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
    iconRing: 'ring-blue-100/80',
    topBar: 'from-sky-400 to-blue-500',
  },
  {
    label: 'Consultas hoje',
    value: '2.114',
    suffix: 'Mês: 48.780',
    icon: ClipboardList,
    iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
    iconRing: 'ring-emerald-100/80',
    topBar: 'from-emerald-400 to-green-500',
  },
  {
    label: 'Incidentes abertos',
    value: '12',
    suffix: '5 críticos abertos',
    icon: AlertTriangle,
    iconGradient: 'from-rose-500 via-red-500 to-red-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
    iconRing: 'ring-red-100/80',
    topBar: 'from-rose-400 to-red-500',
  },
  {
    label: 'SLA médio plataforma',
    value: '11 min',
    suffix: 'Meta interna: 15 min',
    icon: Timer,
    iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
    iconRing: 'ring-orange-100/80',
    topBar: 'from-orange-400 to-amber-500',
  },
  {
    label: 'Terminais',
    value: '146 online',
    suffix: 'Offline: 20 · Manutenção: 8',
    icon: Monitor,
    iconGradient: 'from-teal-500 via-cyan-500 to-sky-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(20,184,166,0.35)]',
    iconRing: 'ring-teal-100/80',
    topBar: 'from-teal-400 to-cyan-500',
  },
  {
    label: 'Receita estimada',
    value: 'R$ 1,02 mi',
    suffix: 'Pacote + avulso no mês',
    icon: DollarSign,
    iconGradient: 'from-amber-500 via-yellow-500 to-orange-500',
    iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.35)]',
    iconRing: 'ring-amber-100/80',
    topBar: 'from-amber-400 to-yellow-500',
  },
]

export type AdminKpiDrillKind =
  | 'prefeituras'
  | 'consultas'
  | 'pacote'
  | 'noc'
  | 'sla'
  | 'terminais'
  | 'receita'
  | 'saude'

export const adminKpiDrillTitles: Record<AdminKpiDrillKind, string> = {
  prefeituras: 'Prefeituras por status de contrato',
  consultas: 'Consultas por município',
  pacote: 'Uso de pacote por município',
  noc: 'Incidentes em aberto',
  sla: 'SLA por município',
  terminais: 'Terminais por município',
  receita: 'Receita estimada por município',
  saude: 'Semáforo operacional',
}

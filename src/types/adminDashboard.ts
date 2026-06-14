import type { PrefeituraSlaStatus } from './prefeituraDashboard'

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

export type AdminKpiDrillKind =
  | 'prefeituras'
  | 'consultas'
  | 'pacote'
  | 'noc'
  | 'sla'
  | 'terminais'
  | 'receita'
  | 'saude'

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
  city: [{ value: 'all', label: 'Todas as cidades' }],
} as const

export function getAdminMunicipalityCityFilterOptions(
  rows: AdminMunicipalityRow[],
  stateKey: string,
) {
  const scoped = stateKey === 'all' ? rows : rows.filter((row) => row.stateKey === stateKey)
  return [
    { value: 'all', label: 'Todas as cidades' },
    ...scoped
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .map((row) => ({ value: row.id, label: row.name })),
  ]
}

export function getAdminMunicipalityStateFilterOptions(rows: AdminMunicipalityRow[]) {
  const stateKeys = new Set(rows.map((row) => row.stateKey))
  return adminDashboardFilterOptions.state.filter(
    (option) => option.value === 'all' || stateKeys.has(option.value as AdminStateKey),
  )
}

export type AdminDashboardPeriod = 'hoje' | '7d' | '30d'

export type AdminDashboardContractFilter = 'all' | 'active' | 'expiring' | 'suspended'
export type AdminDashboardHealthFilter = 'all' | 'green' | 'yellow' | 'red'
export type AdminDashboardStateFilter = 'all' | string

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

export type AdminNocIncidentDto = {
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

export type AdminMunicipalityRowDto = {
  id: string
  name: string
  state: string
  stateKey: string
  contractStatus: Exclude<AdminDashboardContractFilter, 'all'>
  health: Exclude<AdminDashboardHealthFilter, 'all'>
  consultationsToday: number
  consultationsMonth: number
  packageUsagePercent: number
  sla: 'normal' | 'atencao' | 'critico'
  terminalsOnline: number
  terminalsOffline: number
  terminalsMaintenance: number
  terminalsTotal: number
  openNocCount: number
  revenuePackage: number
  revenueAvulso: number
}

export type AdminDashboardKpiDto = {
  key: string
  label: string
  value: string
  suffix: string
  topBar: string
}

export type AdminDashboardHourlyPointDto = {
  hour: string
  value: number
}

export type AdminDashboardPackageUsageDto = {
  contractedTotal: number
  usedInCycle: number
  remainingInPackage: number
  usagePercent: number
  status: 'normal' | 'atencao' | 'critico'
}

export type AdminDashboardRevenueDto = {
  packageTotal: number
  avulsoTotal: number
  grandTotal: number
}

export type AdminDashboardTerminalsDto = {
  online: number
  offline: number
  maintenance: number
  total: number
}

export type AdminDashboardFilterOptionDto = {
  value: string
  label: string
}

export type AdminDashboardTriageBarItemDto = {
  key: string
  label: string
  count: number
  percent: number
}

export type AdminDashboardTriageChartsDto = {
  totalTriages: number
  chronicShare: {
    withChronicCount: number
    withoutChronicCount: number
    withChronicPercent: number
  }
  chronicConditions: AdminDashboardTriageBarItemDto[]
  comorbidities: AdminDashboardTriageBarItemDto[]
  chiefComplaints: AdminDashboardTriageBarItemDto[]
  associatedSymptoms: AdminDashboardTriageBarItemDto[]
}

export type AdminDashboardOverviewDto = {
  filterKey: string
  municipalities: AdminMunicipalityRowDto[]
  nocIncidents: AdminNocIncidentDto[]
  nocHighlight: AdminNocIncidentDto[]
  openNocCount: number
  criticalNocCount: number
  kpis: AdminDashboardKpiDto[]
  hourly: AdminDashboardHourlyPointDto[]
  packageUsage: AdminDashboardPackageUsageDto
  revenue: AdminDashboardRevenueDto
  terminals: AdminDashboardTerminalsDto
  avgSlaMinutes: number
  triageCharts: AdminDashboardTriageChartsDto
  isEmpty: boolean
  filterOptions: {
    period: AdminDashboardFilterOptionDto[]
    state: AdminDashboardFilterOptionDto[]
    city: AdminDashboardFilterOptionDto[]
    contract: AdminDashboardFilterOptionDto[]
    health: AdminDashboardFilterOptionDto[]
  }
}

export type AdminDashboardPeriodRange = {
  startIso: string
  endIso: string
  dayCount: number
}

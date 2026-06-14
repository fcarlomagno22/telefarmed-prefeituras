export type DashboardPeriod = 'hoje' | '7d' | '30d'

export type PrefeituraSlaStatus = 'normal' | 'atencao' | 'critico'

export type PrefeituraUbsTypeKey = 'tipo1' | 'tipo2'

export type PrefeituraDashboardKpiDto = {
  key: string
  label: string
  value: string
  suffix: string
  topBar: string
}

export type PrefeituraDashboardUbsRowDto = {
  id: string
  name: string
  region: string
  regionKey: string
  type: string
  typeKey: PrefeituraUbsTypeKey
  consultationsToday: number
  queueNow: number
  avgWait: string
  absencesToday: number
  sla: PrefeituraSlaStatus
  statusDot: PrefeituraSlaStatus
}

export type PrefeituraDashboardAlertDto = {
  id: string
  title: string
  unit: string
  timeAgo: string
  severity: 'critical' | 'warning'
  regionKey?: string
  category: string
  description: string
  impact: string
  recommendedAction: string
  detectedAt: string
  status: 'open' | 'acknowledged' | 'in_progress'
}

export type PrefeituraDashboardHourlyPointDto = {
  hour: string
  value: number
}

export type PrefeituraDashboardRegionVolumeDto = {
  key: string
  label: string
  value: number
  gradientFrom: string
  gradientTo: string
}

export type PrefeituraDashboardSpecialtyStatDto = {
  key: string
  label: string
  count: number
  available: boolean
  color: string
}

export type PrefeituraDashboardSlaRowDto = {
  unit: string
  wait: string
  status: PrefeituraSlaStatus
}

export type PrefeituraDashboardOverviewDto = {
  kpis: PrefeituraDashboardKpiDto[]
  ubsRows: PrefeituraDashboardUbsRowDto[]
  hourly: PrefeituraDashboardHourlyPointDto[]
  regions: PrefeituraDashboardRegionVolumeDto[]
  specialties: PrefeituraDashboardSpecialtyStatDto[]
  specialtyTotal: number
  slaRows: PrefeituraDashboardSlaRowDto[]
  alerts: PrefeituraDashboardAlertDto[]
  allAlerts: PrefeituraDashboardAlertDto[]
  filterOptions: {
    period: Array<{ value: string; label: string }>
    region: Array<{ value: string; label: string }>
    ubt: Array<{ value: string; label: string }>
  }
  isEmpty: boolean
}

export type DashboardPeriodRange = {
  periodStart: string
  periodEnd: string
  startIso: string
  endIso: string
}

export type UnitWaitStats = {
  avgWaitMinutes: number
  absences: number
}

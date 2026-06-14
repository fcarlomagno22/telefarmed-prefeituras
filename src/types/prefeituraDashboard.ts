export type PrefeituraSlaStatus = 'normal' | 'atencao' | 'critico'

export type PrefeituraRegionKey = 'norte' | 'leste' | 'central' | 'sul'

export type PrefeituraUbsTypeKey = 'tipo1' | 'tipo2'

export type PrefeituraUbsRow = {
  id: string
  name: string
  region: string
  regionKey: PrefeituraRegionKey | string
  type: string
  typeKey: PrefeituraUbsTypeKey
  consultationsToday: number
  queueNow: number
  avgWait: string
  absencesToday: number
  sla: PrefeituraSlaStatus
  statusDot: PrefeituraSlaStatus
}

export type PrefeituraAlertStatus = 'open' | 'acknowledged' | 'in_progress'

export type PrefeituraAlert = {
  id: string
  title: string
  unit: string
  timeAgo: string
  severity: 'critical' | 'warning'
  regionKey?: PrefeituraRegionKey | string
  category: string
  description: string
  impact: string
  recommendedAction: string
  detectedAt: string
  status: PrefeituraAlertStatus
}

export type PrefeituraHourlyPoint = { hour: string; value: number }

export type PrefeituraRegionVolume = {
  key: string
  label: string
  value: number
  gradientFrom: string
  gradientTo: string
}

export type PrefeituraSlaRow = {
  unit: string
  wait: string
  status: PrefeituraSlaStatus
}

export type PrefeituraDashboardFilters = {
  period: string
  region: string
  ubt: string
}

export type PrefeituraSpecialtyStat = {
  key: string
  label: string
  count: number
  available: boolean
  color: string
}

export type PrefeituraDashboardFilterOptions = {
  period: Array<{ value: string; label: string }>
  region: Array<{ value: string; label: string }>
  ubt: Array<{ value: string; label: string }>
}

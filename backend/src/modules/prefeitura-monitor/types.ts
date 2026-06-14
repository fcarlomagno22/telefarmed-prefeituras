export type MonitorComparisonTab = 'produtividade' | 'abandono' | 'espera' | 'avaliacao'

export type TimelinePeriod = 'hoje' | 'ontem' | 'semana'

export type MonitorLiveGridRow = {
  id: string
  name: string
  regionKey: string
  freeStations: number
  busyStations: number
  queuePatients: number
  inConsultation: number
  status: 'ativa' | 'manutencao'
}

export type MonitorComparisonRow = {
  position: number
  unitName: string
  primaryValue: number
  primaryMax: number
  variationPercent: number
}

export type MonitorTimelineSeries = {
  unitId: string
  unitName: string
  color: string
  values: number[]
}

export type MonitorOngoingServiceRow = {
  id: string
  unitRoom: string
  startedAgo: string
  patientName: string
  specialty: string
  age: number
  professional: string
  queue: number
}

export type PrefeituraMonitorOverviewDto = {
  liveGrid: MonitorLiveGridRow[]
  timelineHours: string[]
  timelineSeries: MonitorTimelineSeries[]
  rankingByTab: Record<MonitorComparisonTab, MonitorComparisonRow[]>
  ongoingServices: MonitorOngoingServiceRow[]
  filterOptions: {
    region: Array<{ value: string; label: string }>
    timelinePeriod: Array<{ value: string; label: string }>
  }
}

export type MonitorPeriodRange = {
  startIso: string
  endIso: string
  previousStartIso: string
  previousEndIso: string
}

export type UnitRankingMetrics = {
  unitId: string
  unitName: string
  completed: number
  cancelled: number
  abandoned: number
  avgWaitMinutes: number
  avgRating: number
  ratingCount: number
}

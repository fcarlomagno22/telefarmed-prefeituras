import type { RedeUnitApi } from '../prefeitura-rede/types.js'

export type ConsultaAggregateRow = {
  unidade_ubt_id: string
  status: string
  criado_em: string
  duracao_minutos: number | null
  iniciada_em: string | null
  finalizada_em: string | null
  especialidade_id: string
  especialidade_nome: string
  paciente_sexo: string | null
}

export type PrefeituraConsultasUnitRowDto = {
  id: string
  name: string
  address: string
  region: string
  regionKey: string
  volumeTotal: number
  completed: number
  completionRate: number
  cancelled: number
  cancelledRate: number
  avgDurationMin: number
  status: 'normal' | 'atencao' | 'critico'
}

export type PrefeituraConsultasKpiDto = {
  label: string
  value: string
  footer: string
  footerTone: 'positive' | 'neutral' | 'muted'
  footerIcon?: 'up' | 'down' | 'dot'
  topBar: string
}

export type PrefeituraConsultasDailyPointDto = {
  date: string
  label: string
  value: number
}

export type PrefeituraConsultasSpecialtyItemDto = {
  key: string
  label: string
  sharePercent: number
  color: string
}

export type PrefeituraConsultasOverviewDto = {
  kpis: PrefeituraConsultasKpiDto[]
  units: PrefeituraConsultasUnitRowDto[]
  dailySeries: PrefeituraConsultasDailyPointDto[]
  periodTotal: number
  specialties: PrefeituraConsultasSpecialtyItemDto[]
  filterOptions: {
    units: Array<{ value: string; label: string }>
    regions: Array<{ value: string; label: string }>
  }
}

export type PrefeituraConsultasUnitDetailDto = {
  unit: PrefeituraConsultasUnitRowDto
  periodLabel: string
  periodStart: string
  periodEnd: string
  cnes: string | null
  responsibleName: string | null
  networkAvgVolume: number
  volumeVsNetworkPercent: number
  previousPeriod: {
    volumeDeltaPercent: number
    completionDeltaPp: number
    cancelledDeltaPp: number
    durationDeltaMin: number
  }
  dailySeries: PrefeituraConsultasDailyPointDto[]
  specialties: Array<{
    key: string
    label: string
    count: number
    percent: number
    color: string
  }>
  genderStats: Array<{
    key: 'F' | 'M' | 'NI'
    label: string
    count: number
    percent: number
    color: string
  }>
}

export type UnitContext = RedeUnitApi & {
  cnes: string
  responsibleName: string
}

export type PeriodMetrics = {
  total: number
  completed: number
  cancelled: number
  inProgress: number
  avgDurationMin: number
  specialtyCounts: Map<string, { id: string; label: string; count: number }>
  genderCounts: { F: number; M: number; NI: number }
  dailyCounts: Map<string, number>
  byUnit: Map<string, PeriodMetrics>
}

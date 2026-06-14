export type AdminMonitorUnitRow = {
  id: string
  prefeituraId: string
  prefeitura: string
  ubt: string
  regiao: string
  regionKey: string
  status: string
  emCurso: number
  fila: number
  tempoMedio: string
  operador: string
  terminal: string
  ocupacao: number
  sla: 'normal' | 'atencao' | 'critico'
}

export type AdminMonitorConsultaLiveRow = {
  id: string
  prefeitura: string
  ubt: string
  paciente: string
  especialidade: string
  medico: string
  inicio: string
  status: string
}

export type AdminMonitorTimelinePoint = {
  hora: string
  emCurso: number
  concluidas: number
  aguardando: number
}

export type AdminMonitorRankingUbtRow = {
  id: string
  nome: string
  municipio: string
  municipioId: string
  hoje: number
  ocupacao: number
  performance: string
}

export type AdminMonitorRankingMunicipioRow = {
  id: string
  nome: string
  uf: string
  hoje: number
  fila: number
  ocupacao: number
}

export type AdminMonitorHeatmapRow = {
  regiao: string
  slots: number[]
}

export type AdminMonitorAlert = {
  id: string
  title: string
  municipality: string
  unit: string
  severity: 'critical' | 'warning'
  timeAgo: string
  category: string
  description: string
}

export type AdminMonitorQueueSnapshot = {
  filaMedia: number
  filaMediaTrend: string
  noShowHoje: number
  noShowTaxa: string
}

export type AdminMonitorFilterOptions = {
  municipios: Array<{ value: string; label: string }>
  regions: Array<{ value: string; label: string }>
  timelinePeriod: Array<{ value: string; label: string }>
}

export type AdminMonitorView = {
  filterKey: string
  unitRows: AdminMonitorUnitRow[]
  consultasLive: AdminMonitorConsultaLiveRow[]
  timeline: AdminMonitorTimelinePoint[]
  rankingUbts: AdminMonitorRankingUbtRow[]
  rankingMunicipios: AdminMonitorRankingMunicipioRow[]
  heatmap: AdminMonitorHeatmapRow[]
  alerts: AdminMonitorAlert[]
  queueSnapshot: AdminMonitorQueueSnapshot
  filterOptions: AdminMonitorFilterOptions
}

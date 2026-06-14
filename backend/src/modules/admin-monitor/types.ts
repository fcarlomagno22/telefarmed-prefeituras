export type AdminMonitorTimelinePeriod = 'dia' | '24h' | '7d' | 'hoje' | 'ontem' | 'semana'

export type AdminMonitorStreamKind = 'fila.updated' | 'consulta.updated'

export type AdminMonitorStreamEventDto = {
  kind: AdminMonitorStreamKind
  at: string
  entidadeContratanteId: string
  unidadeUbtId: string
  filaEsperaId?: string
  consultaId?: string
  status?: string
  action?: string
}

export type AdminMonitorKpi = {
  key: string
  label: string
  value: string
  suffix: string
  topBar: string
}

export type AdminMonitorUnitRowDto = {
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

export type AdminMonitorConsultaLiveRowDto = {
  id: string
  prefeitura: string
  ubt: string
  paciente: string
  especialidade: string
  medico: string
  inicio: string
  status: string
}

export type AdminMonitorTimelinePointDto = {
  hora: string
  emCurso: number
  concluidas: number
  aguardando: number
}

export type AdminMonitorOverviewDto = {
  filterKey: string
  unitRows: AdminMonitorUnitRowDto[]
  consultasLive: AdminMonitorConsultaLiveRowDto[]
  timeline: AdminMonitorTimelinePointDto[]
  rankingUbts: Array<{
    id: string
    nome: string
    municipio: string
    municipioId: string
    hoje: number
    ocupacao: number
    performance: string
  }>
  rankingMunicipios: Array<{
    id: string
    nome: string
    uf: string
    hoje: number
    fila: number
    ocupacao: number
  }>
  heatmap: Array<{ regiao: string; slots: number[] }>
  alerts: Array<{
    id: string
    title: string
    municipality: string
    unit: string
    severity: 'critical' | 'warning'
    timeAgo: string
    category: string
    description: string
  }>
  queueSnapshot: {
    filaMedia: number
    filaMediaTrend: string
    noShowHoje: number
    noShowTaxa: string
  }
  filterOptions: {
    municipios: Array<{ value: string; label: string }>
    regions: Array<{ value: string; label: string }>
    timelinePeriod: Array<{ value: string; label: string }>
  }
  kpis: AdminMonitorKpi[]
}

export type AdminMonitorCatalogUnit = {
  id: string
  entidadeId: string
  prefeituraNome: string
  uf: string
  name: string
  region: string
  regionKey: string
  stationsTotal: number
  stationsOnline: number
  status: 'ativa' | 'manutencao' | 'inativa'
  operatorName: string
}

export type UbtDashboardUnit = {
  id: string
  unitName: string
  stationLabel: string
  regionLabel: string | null
  operationalState: string | null
  activeTerminals: number
  totalTerminals: number
}

export type UbtDashboardKpi = {
  id: string
  title: string
  value: string
  subtext: string
  subtextClass: string
  iconTone: 'orange' | 'green' | 'red'
  sparkline?: number[]
  isAlert?: boolean
}

export type UbtDashboardFilaResumoItem = {
  label: string
  count: number
  tone: 'orange' | 'green' | 'red'
  progress: number
}

export type UbtDashboardFilaResumo = {
  items: UbtDashboardFilaResumoItem[]
  priorityCount: number
  avgWaitMinutes: number
  serverTime: string
}

export type UbtDashboardConsultaHojeStatus =
  | 'waiting'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type UbtDashboardConsultaHoje = {
  id: string
  time: string
  patient: string
  specialty: string
  status: UbtDashboardConsultaHojeStatus
  statusLabel: string
  pacienteId: string
  patientCpf: string
  patientPhone: string
  specialtyId: string
  filaEsperaId: string | null
  filaStatus: 'aguardando' | 'chamado' | 'em_atendimento' | null
  origin: 'agendado' | 'espontaneo'
  callable: boolean
}

export type UbtDashboardOverview = {
  unit: UbtDashboardUnit
  kpis: UbtDashboardKpi[]
  filaResumo: UbtDashboardFilaResumo
  consultasHoje: UbtDashboardConsultaHoje[]
  serverTime: string
}

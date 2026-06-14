export type MonitorStationLegendKey = 'livre' | 'ocupado' | 'fila' | 'consulta' | 'offline'

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

export type MonitorComparisonTab =
  | 'produtividade'
  | 'abandono'
  | 'espera'
  | 'avaliacao'

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

export const monitorStationLegend: {
  key: MonitorStationLegendKey
  label: string
  dotClass: string
}[] = [
  { key: 'livre', label: 'Livre', dotClass: 'bg-emerald-500' },
  { key: 'ocupado', label: 'Ocupado', dotClass: 'bg-orange-500' },
  { key: 'fila', label: 'Fila', dotClass: 'bg-violet-500' },
  { key: 'consulta', label: 'Em consulta', dotClass: 'bg-sky-500' },
  { key: 'offline', label: 'Offline', dotClass: 'bg-gray-400' },
]

export const monitorComparisonTabs: { key: MonitorComparisonTab; label: string }[] = [
  { key: 'produtividade', label: 'Produtividade' },
  { key: 'abandono', label: 'Taxa de abandono' },
  { key: 'espera', label: 'Tempo médio de espera' },
  { key: 'avaliacao', label: 'Avaliação (feedback)' },
]

export const monitorComparisonPrimaryColumn: Record<
  MonitorComparisonTab,
  { header: string; format: (value: number) => string }
> = {
  produtividade: {
    header: 'Atendimentos concluídos',
    format: (v) => String(v),
  },
  abandono: {
    header: 'Taxa de abandono (%)',
    format: (v) => `${v}%`,
  },
  espera: {
    header: 'Tempo médio (min)',
    format: (v) => `${v} min`,
  },
  avaliacao: {
    header: 'Nota média',
    format: (v) => v.toFixed(1),
  },
}

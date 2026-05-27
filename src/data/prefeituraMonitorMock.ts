export type MonitorStationLegendKey = 'livre' | 'ocupado' | 'fila' | 'consulta' | 'offline'

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

export const monitorLiveGridRows: MonitorLiveGridRow[] = [
  {
    id: 'ubt-centro',
    name: 'UBT Centro',
    regionKey: 'centro',
    freeStations: 4,
    busyStations: 2,
    queuePatients: 1,
    inConsultation: 1,
    status: 'ativa',
  },
  {
    id: 'ubt-norte',
    name: 'UBT Norte',
    regionKey: 'norte',
    freeStations: 3,
    busyStations: 3,
    queuePatients: 2,
    inConsultation: 2,
    status: 'ativa',
  },
  {
    id: 'ubt-sul',
    name: 'UBT Sul',
    regionKey: 'sul',
    freeStations: 5,
    busyStations: 1,
    queuePatients: 0,
    inConsultation: 1,
    status: 'ativa',
  },
  {
    id: 'ubt-leste',
    name: 'UBT Leste',
    regionKey: 'leste',
    freeStations: 2,
    busyStations: 4,
    queuePatients: 3,
    inConsultation: 1,
    status: 'ativa',
  },
  {
    id: 'ubt-oeste',
    name: 'UBT Oeste',
    regionKey: 'oeste',
    freeStations: 0,
    busyStations: 0,
    queuePatients: 0,
    inConsultation: 0,
    status: 'manutencao',
  },
]

export type MonitorComparisonTab =
  | 'produtividade'
  | 'abandono'
  | 'espera'
  | 'avaliacao'

export const monitorComparisonTabs: { key: MonitorComparisonTab; label: string }[] = [
  { key: 'produtividade', label: 'Produtividade' },
  { key: 'abandono', label: 'Taxa de abandono' },
  { key: 'espera', label: 'Tempo médio de espera' },
  { key: 'avaliacao', label: 'Avaliação (feedback)' },
]

export type MonitorComparisonRow = {
  position: number
  unitName: string
  primaryValue: number
  primaryMax: number
  variationPercent: number
}

export const monitorComparisonByTab: Record<MonitorComparisonTab, MonitorComparisonRow[]> = {
  produtividade: [
    { position: 1, unitName: 'UBT Centro', primaryValue: 48, primaryMax: 48, variationPercent: 12 },
    { position: 2, unitName: 'UBT Norte', primaryValue: 42, primaryMax: 48, variationPercent: 8 },
    { position: 3, unitName: 'UBT Sul', primaryValue: 38, primaryMax: 48, variationPercent: -3 },
    { position: 4, unitName: 'UBT Leste', primaryValue: 31, primaryMax: 48, variationPercent: 5 },
    { position: 5, unitName: 'UBT Oeste', primaryValue: 0, primaryMax: 48, variationPercent: -100 },
  ],
  abandono: [
    { position: 1, unitName: 'UBT Sul', primaryValue: 2, primaryMax: 12, variationPercent: -1 },
    { position: 2, unitName: 'UBT Centro', primaryValue: 4, primaryMax: 12, variationPercent: 0 },
    { position: 3, unitName: 'UBT Norte', primaryValue: 6, primaryMax: 12, variationPercent: 2 },
    { position: 4, unitName: 'UBT Leste', primaryValue: 9, primaryMax: 12, variationPercent: 4 },
    { position: 5, unitName: 'UBT Oeste', primaryValue: 0, primaryMax: 12, variationPercent: 0 },
  ],
  espera: [
    { position: 1, unitName: 'UBT Sul', primaryValue: 4, primaryMax: 18, variationPercent: -2 },
    { position: 2, unitName: 'UBT Centro', primaryValue: 6, primaryMax: 18, variationPercent: 1 },
    { position: 3, unitName: 'UBT Norte', primaryValue: 9, primaryMax: 18, variationPercent: 3 },
    { position: 4, unitName: 'UBT Leste', primaryValue: 14, primaryMax: 18, variationPercent: 6 },
    { position: 5, unitName: 'UBT Oeste', primaryValue: 0, primaryMax: 18, variationPercent: 0 },
  ],
  avaliacao: [
    { position: 1, unitName: 'UBT Centro', primaryValue: 4.9, primaryMax: 5, variationPercent: 2 },
    { position: 2, unitName: 'UBT Sul', primaryValue: 4.8, primaryMax: 5, variationPercent: 1 },
    { position: 3, unitName: 'UBT Norte', primaryValue: 4.6, primaryMax: 5, variationPercent: 0 },
    { position: 4, unitName: 'UBT Leste', primaryValue: 4.3, primaryMax: 5, variationPercent: -1 },
    { position: 5, unitName: 'UBT Oeste', primaryValue: 0, primaryMax: 5, variationPercent: 0 },
  ],
}

/** Ranking completo exibido no drawer (todas as UBTs do recorte). */
export const monitorComparisonFullByTab: Record<MonitorComparisonTab, MonitorComparisonRow[]> = {
  produtividade: [
    ...monitorComparisonByTab.produtividade,
    { position: 6, unitName: 'UBT Jardim América', primaryValue: 28, primaryMax: 48, variationPercent: 4 },
    { position: 7, unitName: 'UBT Vila Nova', primaryValue: 24, primaryMax: 48, variationPercent: -2 },
    { position: 8, unitName: 'UBT São José', primaryValue: 21, primaryMax: 48, variationPercent: 1 },
    { position: 9, unitName: 'UBT Industrial', primaryValue: 18, primaryMax: 48, variationPercent: 6 },
    { position: 10, unitName: 'UBT Cidade Nova', primaryValue: 15, primaryMax: 48, variationPercent: -4 },
    { position: 11, unitName: 'UBT Parque Sul', primaryValue: 12, primaryMax: 48, variationPercent: 0 },
    { position: 12, unitName: 'UBT Alto da Serra', primaryValue: 9, primaryMax: 48, variationPercent: 3 },
  ],
  abandono: [
    ...monitorComparisonByTab.abandono,
    { position: 6, unitName: 'UBT Jardim América', primaryValue: 5, primaryMax: 12, variationPercent: -1 },
    { position: 7, unitName: 'UBT Vila Nova', primaryValue: 7, primaryMax: 12, variationPercent: 3 },
    { position: 8, unitName: 'UBT São José', primaryValue: 8, primaryMax: 12, variationPercent: 1 },
    { position: 9, unitName: 'UBT Industrial', primaryValue: 10, primaryMax: 12, variationPercent: 5 },
    { position: 10, unitName: 'UBT Cidade Nova', primaryValue: 11, primaryMax: 12, variationPercent: 2 },
    { position: 11, unitName: 'UBT Parque Sul', primaryValue: 11, primaryMax: 12, variationPercent: 0 },
    { position: 12, unitName: 'UBT Alto da Serra', primaryValue: 12, primaryMax: 12, variationPercent: 4 },
  ],
  espera: [
    ...monitorComparisonByTab.espera,
    { position: 6, unitName: 'UBT Jardim América', primaryValue: 8, primaryMax: 18, variationPercent: 2 },
    { position: 7, unitName: 'UBT Vila Nova', primaryValue: 10, primaryMax: 18, variationPercent: 4 },
    { position: 8, unitName: 'UBT São José', primaryValue: 11, primaryMax: 18, variationPercent: 1 },
    { position: 9, unitName: 'UBT Industrial', primaryValue: 12, primaryMax: 18, variationPercent: 3 },
    { position: 10, unitName: 'UBT Cidade Nova', primaryValue: 15, primaryMax: 18, variationPercent: 5 },
    { position: 11, unitName: 'UBT Parque Sul', primaryValue: 16, primaryMax: 18, variationPercent: 2 },
    { position: 12, unitName: 'UBT Alto da Serra', primaryValue: 17, primaryMax: 18, variationPercent: 4 },
  ],
  avaliacao: [
    ...monitorComparisonByTab.avaliacao,
    { position: 6, unitName: 'UBT Jardim América', primaryValue: 4.5, primaryMax: 5, variationPercent: 1 },
    { position: 7, unitName: 'UBT Vila Nova', primaryValue: 4.4, primaryMax: 5, variationPercent: 0 },
    { position: 8, unitName: 'UBT São José', primaryValue: 4.2, primaryMax: 5, variationPercent: -2 },
    { position: 9, unitName: 'UBT Industrial', primaryValue: 4.1, primaryMax: 5, variationPercent: 1 },
    { position: 10, unitName: 'UBT Cidade Nova', primaryValue: 4.0, primaryMax: 5, variationPercent: 0 },
    { position: 11, unitName: 'UBT Parque Sul', primaryValue: 3.9, primaryMax: 5, variationPercent: -1 },
    { position: 12, unitName: 'UBT Alto da Serra', primaryValue: 3.8, primaryMax: 5, variationPercent: -2 },
  ],
}

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

export type MonitorTimelineSeries = {
  unitId: string
  unitName: string
  color: string
  values: number[]
}

export const monitorTimelineHours = [
  '06h',
  '08h',
  '10h',
  '12h',
  '14h',
  '16h',
  '18h',
  '20h',
  '22h',
] as const

export const monitorTimelineSeries: MonitorTimelineSeries[] = [
  {
    unitId: 'centro',
    unitName: 'UBT Centro',
    color: '#27AE60',
    values: [2, 5, 8, 12, 18, 22, 16, 10, 4],
  },
  {
    unitId: 'norte',
    unitName: 'UBT Norte',
    color: '#2D9CDB',
    values: [1, 4, 7, 10, 15, 19, 14, 8, 3],
  },
  {
    unitId: 'sul',
    unitName: 'UBT Sul',
    color: '#F2994A',
    values: [3, 6, 9, 11, 14, 17, 12, 7, 2],
  },
  {
    unitId: 'leste',
    unitName: 'UBT Leste',
    color: '#BB6BD9',
    values: [0, 3, 6, 9, 13, 16, 11, 6, 1],
  },
  {
    unitId: 'oeste',
    unitName: 'UBT Oeste',
    color: '#95A5A6',
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
]

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

export const monitorOngoingServices: MonitorOngoingServiceRow[] = [
  {
    id: 'atd-1',
    unitRoom: 'UBT Centro — Sala 03',
    startedAgo: '00:12:34',
    patientName: 'Maria Aparecida Silva',
    specialty: 'Clínica Geral',
    age: 62,
    professional: 'Dra. Ana Beatriz — CRM 12345',
    queue: 0,
  },
  {
    id: 'atd-2',
    unitRoom: 'UBT Norte — Sala 01',
    startedAgo: '00:08:12',
    patientName: 'João Pedro Santos',
    specialty: 'Pediatria',
    age: 8,
    professional: 'Dr. Ricardo Menezes — CRM 33421',
    queue: 1,
  },
  {
    id: 'atd-3',
    unitRoom: 'UBT Sul — Sala 02',
    startedAgo: '00:05:47',
    patientName: 'Helena Costa Ribeiro',
    specialty: 'Dermatologia',
    age: 34,
    professional: 'Dra. Camila Duarte — CRM 28901',
    queue: 0,
  },
  {
    id: 'atd-4',
    unitRoom: 'UBT Leste — Sala 04',
    startedAgo: '00:18:05',
    patientName: 'Antônio Ferreira Lima',
    specialty: 'Clínica Geral',
    age: 71,
    professional: 'Dr. Paulo Henrique — CRM 19877',
    queue: 2,
  },
]

export const monitorRegionFilterOptions = [
  { value: 'todas', label: 'Todas as regiões' },
  { value: 'centro', label: 'Centro' },
  { value: 'norte', label: 'Norte' },
  { value: 'sul', label: 'Sul' },
  { value: 'leste', label: 'Leste' },
  { value: 'oeste', label: 'Oeste' },
] as const

export const monitorTimelinePeriodOptions = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: 'semana', label: 'Esta semana' },
] as const

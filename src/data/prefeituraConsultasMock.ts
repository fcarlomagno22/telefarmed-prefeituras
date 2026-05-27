import type { PrefeituraSlaStatus } from './prefeituraDashboardMock'

export type PrefeituraConsultasUnitRow = {
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
  status: PrefeituraSlaStatus
  dashboardRowId?: string
}

export type PrefeituraConsultasKpi = {
  label: string
  value: string
  footer: string
  footerTone: 'positive' | 'neutral' | 'muted'
  footerIcon?: 'up' | 'down' | 'dot'
  topBar: string
}

export type PrefeituraConsultasDailyPoint = {
  date: string
  label: string
  value: number
}

export type PrefeituraConsultasSpecialtyItem = {
  key: string
  label: string
  sharePercent: number
  color: string
}

export const prefeituraConsultasDefaultPeriod = {
  start: '2025-05-01',
  end: '2025-05-31',
}

export const prefeituraConsultasUnitFilterOptions = [
  { value: '', label: 'Selecione uma unidade' },
  { value: 'ubt_centro', label: 'UBT Centro' },
  { value: 'ubt_norte', label: 'UBT Norte' },
  { value: 'ubt_sul', label: 'UBT Sul' },
  { value: 'ubt_leste', label: 'UBT Leste' },
  { value: 'ubt_oeste', label: 'UBT Oeste' },
  { value: 'todas', label: 'Todas as unidades' },
] as const

export const prefeituraConsultasRegionFilterOptions = [
  { value: '', label: 'Selecione uma região' },
  { value: 'centro', label: 'Centro' },
  { value: 'norte', label: 'Norte' },
  { value: 'sul', label: 'Sul' },
  { value: 'leste', label: 'Leste' },
  { value: 'oeste', label: 'Oeste' },
  { value: 'todas', label: 'Todas as regiões' },
] as const

export const prefeituraConsultasKpiCards: PrefeituraConsultasKpi[] = [
  {
    label: 'Volume de consultas',
    value: '12.746',
    footer: '+18% vs período anterior',
    footerTone: 'positive',
    footerIcon: 'up',
    topBar: 'from-sky-400 to-blue-500',
  },
  {
    label: 'Taxa de conclusão',
    value: '91,4%',
    footer: '+3,2 p.p. vs período anterior',
    footerTone: 'positive',
    footerIcon: 'up',
    topBar: 'from-emerald-400 to-green-500',
  },
  {
    label: 'Cancelamentos',
    value: '1.126',
    footer: '8,8% do total',
    footerTone: 'muted',
    footerIcon: 'dot',
    topBar: 'from-orange-400 to-amber-500',
  },
  {
    label: 'Duração média',
    value: '18 min',
    footer: '-2 min vs período anterior',
    footerTone: 'positive',
    footerIcon: 'down',
    topBar: 'from-cyan-400 to-sky-500',
  },
  {
    label: 'Especialidade mais demandada',
    value: 'Clínico Geral',
    footer: '35% do total',
    footerTone: 'neutral',
    topBar: 'from-indigo-400 to-blue-600',
  },
]

export const prefeituraConsultasDailySeries: PrefeituraConsultasDailyPoint[] = [
  { date: '2025-05-01', label: '01/05', value: 420 },
  { date: '2025-05-08', label: '08/05', value: 510 },
  { date: '2025-05-15', label: '15/05', value: 680 },
  { date: '2025-05-22', label: '22/05', value: 590 },
  { date: '2025-05-29', label: '29/05', value: 720 },
  { date: '2025-05-31', label: '31/05', value: 640 },
]

export const prefeituraConsultasPeriodTotal = 12746

export const prefeituraConsultasSpecialties: PrefeituraConsultasSpecialtyItem[] = [
  { key: 'clinico', label: 'Clínico Geral', sharePercent: 35, color: '#3b82f6' },
  { key: 'pediatria', label: 'Pediatria', sharePercent: 18, color: '#10b981' },
  { key: 'gineco', label: 'Ginecologia', sharePercent: 15, color: '#f97316' },
  { key: 'cardio', label: 'Cardiologia', sharePercent: 12, color: '#8b5cf6' },
  { key: 'psico', label: 'Psicologia', sharePercent: 8, color: '#ec4899' },
  { key: 'outros', label: 'Outros', sharePercent: 12, color: '#64748b' },
]

export const prefeituraConsultasTableColumns = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'regiao', label: 'Região' },
  { value: 'volume', label: 'Volume total' },
  { value: 'concluidas', label: 'Concluídas' },
  { value: 'taxa', label: 'Taxa conclusão' },
  { value: 'canceladas', label: 'Canceladas' },
  { value: 'duracao', label: 'Duração média' },
  { value: 'status', label: 'Status' },
] as const

const baseUnits: PrefeituraConsultasUnitRow[] = [
  {
    id: 'cons-1',
    name: 'UBT Centro',
    address: 'Av. Brasil, 1200',
    region: 'Centro',
    regionKey: 'centro',
    volumeTotal: 2145,
    completed: 1987,
    completionRate: 92.6,
    cancelled: 196,
    cancelledRate: 9.1,
    avgDurationMin: 17,
    status: 'normal',
    dashboardRowId: '1',
  },
  {
    id: 'cons-2',
    name: 'UBT Norte',
    address: 'Av. Norte, 450',
    region: 'Norte',
    regionKey: 'norte',
    volumeTotal: 1980,
    completed: 1812,
    completionRate: 91.5,
    cancelled: 168,
    cancelledRate: 8.5,
    avgDurationMin: 18,
    status: 'normal',
    dashboardRowId: '2',
  },
  {
    id: 'cons-3',
    name: 'UBT Sul',
    address: 'Qd 12 Lt 3',
    region: 'Sul',
    regionKey: 'sul',
    volumeTotal: 1820,
    completed: 1650,
    completionRate: 90.7,
    cancelled: 170,
    cancelledRate: 9.3,
    avgDurationMin: 19,
    status: 'atencao',
    dashboardRowId: '4',
  },
  {
    id: 'cons-4',
    name: 'UBT Leste',
    address: 'Setor Comercial, 200',
    region: 'Leste',
    regionKey: 'leste',
    volumeTotal: 1765,
    completed: 1608,
    completionRate: 91.1,
    cancelled: 157,
    cancelledRate: 8.9,
    avgDurationMin: 18,
    status: 'normal',
    dashboardRowId: '3',
  },
  {
    id: 'cons-5',
    name: 'UBT Oeste',
    address: 'Av. Oeste, 780',
    region: 'Oeste',
    regionKey: 'oeste',
    volumeTotal: 1542,
    completed: 1386,
    completionRate: 89.9,
    cancelled: 156,
    cancelledRate: 10.1,
    avgDurationMin: 20,
    status: 'atencao',
    dashboardRowId: '5',
  },
]

function generateExtraUnits(): PrefeituraConsultasUnitRow[] {
  const templates = [
    { name: 'UBT Asa Norte', region: 'Norte', regionKey: 'norte', status: 'normal' as const },
    { name: 'UBT Taguatinga', region: 'Oeste', regionKey: 'oeste', status: 'normal' as const },
    { name: 'UBT Ceilândia', region: 'Oeste', regionKey: 'oeste', status: 'atencao' as const },
    { name: 'UBT Samambaia', region: 'Oeste', regionKey: 'oeste', status: 'normal' as const },
    { name: 'UBT Planaltina', region: 'Norte', regionKey: 'norte', status: 'normal' as const },
    { name: 'UBT Gama', region: 'Leste', regionKey: 'leste', status: 'normal' as const },
    { name: 'UBT Sobradinho', region: 'Norte', regionKey: 'norte', status: 'atencao' as const },
    { name: 'UBT Recanto das Emas', region: 'Sul', regionKey: 'sul', status: 'normal' as const },
    { name: 'UBT Santa Maria', region: 'Sul', regionKey: 'sul', status: 'normal' as const },
    { name: 'UBT Jardim das Flores', region: 'Norte', regionKey: 'norte', status: 'normal' as const },
    { name: 'UBT Vila Esperança', region: 'Leste', regionKey: 'leste', status: 'atencao' as const },
    { name: 'UBT Paranoá', region: 'Leste', regionKey: 'leste', status: 'normal' as const },
    { name: 'UBT Brazlândia', region: 'Norte', regionKey: 'norte', status: 'normal' as const },
    { name: 'UBT Riacho Fundo', region: 'Sul', regionKey: 'sul', status: 'normal' as const },
    { name: 'UBT Cruzeiro', region: 'Sul', regionKey: 'sul', status: 'atencao' as const },
    { name: 'UBT Núcleo Bandeirante', region: 'Sul', regionKey: 'sul', status: 'normal' as const },
    { name: 'UBT Guará', region: 'Sul', regionKey: 'sul', status: 'critico' as const },
    { name: 'UBT Vicente Pires', region: 'Norte', regionKey: 'norte', status: 'critico' as const },
    { name: 'UBT Águas Claras', region: 'Oeste', regionKey: 'oeste', status: 'normal' as const },
  ]

  return templates.map((tpl, index) => {
    const volumeTotal = 980 + index * 47
    const completionRate = 88.5 + (index % 5) * 0.6
    const completed = Math.round((volumeTotal * completionRate) / 100)
    const cancelled = volumeTotal - completed
    const cancelledRate = Number(((cancelled / volumeTotal) * 100).toFixed(1))

    return {
      id: `cons-extra-${index + 6}`,
      name: tpl.name,
      address: `Endereço ${index + 6}, s/n`,
      region: tpl.region,
      regionKey: tpl.regionKey,
      volumeTotal,
      completed,
      completionRate: Number(completionRate.toFixed(1)),
      cancelled,
      cancelledRate,
      avgDurationMin: 16 + (index % 5),
      status: tpl.status,
    }
  })
}

export const prefeituraConsultasUnitRows: PrefeituraConsultasUnitRow[] = [
  ...baseUnits,
  ...generateExtraUnits(),
]

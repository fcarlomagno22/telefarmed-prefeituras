/** Re-export de tipos — dados mock removidos da página; rede ainda referencia rows estáticos. */
export type {
  PrefeituraAlert,
  PrefeituraAlertStatus,
  PrefeituraRegionKey,
  PrefeituraSlaStatus,
  PrefeituraUbsRow,
  PrefeituraUbsTypeKey,
} from '../types/prefeituraDashboard'

import type { PrefeituraUbsRow } from '../types/prefeituraDashboard'

/** Fallback estático para módulos legados (ex.: rede mock). */
export const prefeituraUbsRows: PrefeituraUbsRow[] = []

export const prefeituraFilterOptions = {
  period: [
    { value: 'hoje', label: 'Hoje' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
  ],
  region: [{ value: 'todas', label: 'Todas' }],
} as const

export function getPrefeituraDashboardUbtFilterOptions(region: string = 'todas') {
  const rows =
    region === 'todas'
      ? prefeituraUbsRows
      : prefeituraUbsRows.filter((row) => row.regionKey === region)

  return [
    { value: 'todas', label: 'Todas as UBTs' },
    ...rows.map((row) => ({ value: row.id, label: row.name })),
  ]
}

export const prefeituraHourlyConsultations: Array<{ hour: string; value: number }> = []

export const prefeituraRegionVolumes: Array<{
  key: string
  label: string
  value: number
  gradientFrom: string
  gradientTo: string
}> = []

export const prefeituraAlerts: import('../types/prefeituraDashboard').PrefeituraAlert[] = []

export const prefeituraDashboardKpiCards = [] as import('../components/ui/KpiStatCards').KpiStatCardItem[]

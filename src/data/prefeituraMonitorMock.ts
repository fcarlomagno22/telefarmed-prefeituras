/** Re-export de tipos — dados mock removidos; UI usa API prefeitura-monitor. */
export type {
  MonitorComparisonRow,
  MonitorComparisonTab,
  MonitorLiveGridRow,
  MonitorOngoingServiceRow,
  MonitorStationLegendKey,
  MonitorTimelineSeries,
} from '../types/prefeituraMonitor'

export {
  monitorComparisonPrimaryColumn,
  monitorComparisonTabs,
  monitorStationLegend,
} from '../types/prefeituraMonitor'

export const monitorLiveGridRows: import('../types/prefeituraMonitor').MonitorLiveGridRow[] = []

export const monitorComparisonByTab: Record<
  import('../types/prefeituraMonitor').MonitorComparisonTab,
  import('../types/prefeituraMonitor').MonitorComparisonRow[]
> = {
  produtividade: [],
  abandono: [],
  espera: [],
  avaliacao: [],
}

export const monitorComparisonFullByTab = monitorComparisonByTab

export const monitorTimelineHours: string[] = []

export const monitorTimelineSeries: import('../types/prefeituraMonitor').MonitorTimelineSeries[] = []

export const monitorOngoingServices: import('../types/prefeituraMonitor').MonitorOngoingServiceRow[] =
  []

export const monitorRegionFilterOptions = [{ value: 'todas', label: 'Todas as regiões' }] as const

export const monitorTimelinePeriodOptions = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: 'semana', label: 'Esta semana' },
] as const

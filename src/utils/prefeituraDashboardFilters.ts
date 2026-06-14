import type {
  PrefeituraDashboardFilters,
  PrefeituraHourlyPoint,
  PrefeituraRegionVolume,
  PrefeituraSlaRow,
} from '../types/prefeituraDashboard'

export type { PrefeituraDashboardFilters, PrefeituraHourlyPoint, PrefeituraRegionVolume, PrefeituraSlaRow }

export function buildPrefeituraDashboardFilterSummary(
  filters: PrefeituraDashboardFilters,
  options: {
    period: Array<{ value: string; label: string }>
    region: Array<{ value: string; label: string }>
    ubt: Array<{ value: string; label: string }>
  },
): string[] {
  const period = options.period.find((item) => item.value === filters.period)?.label ?? filters.period
  const region = options.region.find((item) => item.value === filters.region)?.label ?? filters.region
  const ubt = options.ubt.find((item) => item.value === filters.ubt)?.label ?? filters.ubt

  return [`Período: ${period}`, `Região: ${region}`, `UBT: ${ubt}`]
}

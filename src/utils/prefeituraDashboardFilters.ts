import type { KpiStatCardItem } from '../components/ui/KpiStatCards'
import {
  prefeituraAlerts,
  prefeituraDashboardKpiCards,
  getPrefeituraDashboardUbtFilterOptions,
  prefeituraFilterOptions,
  prefeituraHourlyConsultations,
  prefeituraRegionVolumes,
  prefeituraUbsRows,
  type PrefeituraAlert,
  type PrefeituraSlaStatus,
  type PrefeituraUbsRow,
} from '../data/prefeituraDashboardMock'
import { prefeituraSpecialtyStats } from '../data/prefeituraSpecialtyStats'
import type { PrefeituraSpecialtyStat } from '../data/prefeituraSpecialtyStats'
import {
  computePrefeituraPackageUsage,
  type PrefeituraPackageUsageView,
} from './prefeituraConsultationPackage'

export type PrefeituraDashboardFilters = {
  period: string
  region: string
  ubt: string
}

export type PrefeituraHourlyPoint = { hour: string; value: number }

export type PrefeituraRegionVolume = {
  key: string
  label: string
  value: number
  gradientFrom: string
  gradientTo: string
}

export type PrefeituraSlaRow = {
  unit: string
  wait: string
  status: PrefeituraSlaStatus
}

export type PrefeituraDashboardView = {
  filterKey: string
  ubsRows: PrefeituraUbsRow[]
  kpiCards: KpiStatCardItem[]
  hourly: PrefeituraHourlyPoint[]
  regions: PrefeituraRegionVolume[]
  specialties: PrefeituraSpecialtyStat[]
  specialtyTotal: number
  slaRows: PrefeituraSlaRow[]
  alerts: PrefeituraAlert[]
  allAlerts: PrefeituraAlert[]
  packageUsage: PrefeituraPackageUsageView
  isEmpty: boolean
}

const HIGHLIGHT_ALERTS_LIMIT = 4

const PERIOD_MULTIPLIER: Record<string, number> = {
  hoje: 1,
  '7d': 6.4,
  '30d': 23,
}

const BASE_NETWORK_CONSULTATIONS = prefeituraUbsRows.reduce(
  (sum, row) => sum + row.consultationsToday,
  0,
)

const REGION_META = Object.fromEntries(
  prefeituraRegionVolumes.map((r) => [r.key, r]),
) as Record<string, (typeof prefeituraRegionVolumes)[number]>

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value))
}

function parseWaitMinutes(wait: string) {
  return parseInt(wait, 10) || 0
}

function formatWaitMinutes(minutes: number) {
  return `${Math.max(1, Math.round(minutes))} min`
}

function filterUbsRows(filters: PrefeituraDashboardFilters) {
  return prefeituraUbsRows.filter((row) => {
    if (filters.region !== 'todas' && row.regionKey !== filters.region) return false
    if (filters.ubt !== 'todas' && row.id !== filters.ubt) return false
    return true
  })
}

export function filterPrefeituraAlerts(
  filters: PrefeituraDashboardFilters,
  ubsRows: PrefeituraUbsRow[],
) {
  const ubsNames = new Set(ubsRows.map((r) => r.name))

  return prefeituraAlerts.filter((alert) => {
    if (alert.regionKey) {
      if (filters.region !== 'todas' && alert.regionKey !== filters.region) return false
      if (filters.ubt !== 'todas') {
        const selectedUbt = prefeituraUbsRows.find((row) => row.id === filters.ubt)
        return selectedUbt?.regionKey === alert.regionKey
      }
      return ubsRows.some((row) => row.regionKey === alert.regionKey)
    }

    return ubsNames.has(alert.unit)
  })
}

function buildRegionVolumes(ubsRows: PrefeituraUbsRow[], periodMult: number, filters: PrefeituraDashboardFilters) {
  const totals = new Map<string, number>()

  for (const row of ubsRows) {
    totals.set(row.regionKey, (totals.get(row.regionKey) ?? 0) + row.consultationsToday)
  }

  const keys =
    filters.region === 'todas'
      ? prefeituraRegionVolumes.map((r) => r.key)
      : [filters.region]

  return keys
    .map((key) => {
      const meta = REGION_META[key]
      if (!meta) return null
      const value = Math.round((totals.get(key) ?? 0) * periodMult)
      return {
        key: meta.key,
        label: meta.label,
        value,
        gradientFrom: meta.gradientFrom,
        gradientTo: meta.gradientTo,
      }
    })
    .filter((r): r is PrefeituraRegionVolume => r !== null && r.value > 0)
}

function buildHourly(shareRatio: number, period: string) {
  const periodShape = period === '7d' ? 1.08 : period === '30d' ? 1.15 : 1

  return prefeituraHourlyConsultations.map((point) => ({
    hour: point.hour,
    value: Math.max(0, Math.round(point.value * shareRatio * periodShape)),
  }))
}

function buildSpecialties(shareRatio: number, periodMult: number) {
  const scale = shareRatio * periodMult

  const specialties = prefeituraSpecialtyStats.map((item) => ({
    ...item,
    count: Math.max(0, Math.round(item.count * scale)),
  }))

  const specialtyTotal = specialties.reduce((sum, item) => sum + item.count, 0)

  return { specialties, specialtyTotal }
}

function buildKpiCards(
  ubsRows: PrefeituraUbsRow[],
  period: string,
  periodMult: number,
  networkShare: number,
) {
  const consultations = ubsRows.reduce((sum, row) => sum + row.consultationsToday, 0) * periodMult
  const queue = ubsRows.reduce((sum, row) => sum + row.queueNow, 0)
  const absences = ubsRows.reduce((sum, row) => sum + row.absencesToday, 0) * periodMult

  const totalWait = ubsRows.reduce((sum, row) => sum + parseWaitMinutes(row.avgWait) * row.queueNow, 0)
  const totalQueue = ubsRows.reduce((sum, row) => sum + row.queueNow, 0) || 1
  const avgWait = formatWaitMinutes(totalWait / totalQueue)

  const periodLabel =
    period === '7d' ? 'Consultas (7 dias)' : period === '30d' ? 'Consultas (30 dias)' : 'Consultas hoje'

  const periodSuffix =
    period === 'hoje'
      ? `${networkShare < 1 ? `${Math.round(networkShare * 100)}% da rede` : '+12% vs ontem'}`
      : period === '7d'
        ? 'Média diária consolidada'
        : 'Acumulado do mês'

  const templates = prefeituraDashboardKpiCards

  return [
    { ...templates[0], label: periodLabel, value: formatNumber(consultations), suffix: periodSuffix },
    {
      ...templates[1],
      value: formatNumber(queue),
      suffix: queue > 120 ? 'Acima da meta' : '+8% vs ontem',
    },
    {
      ...templates[2],
      value: formatNumber(Math.max(4, Math.round(68 * networkShare))),
      suffix: `${ubsRows.length} UBT no recorte`,
    },
    {
      ...templates[3],
      value: formatNumber(Math.max(ubsRows.length, Math.round(86 * networkShare))),
      suffix: `Ativas: ${ubsRows.length}`,
    },
    {
      ...templates[4],
      value: formatNumber(absences),
      suffix: absences > 60 ? '+15% vs ontem' : 'Dentro do esperado',
    },
    { ...templates[5], value: avgWait, suffix: period === 'hoje' ? '-6 min vs ontem' : 'Média do recorte' },
  ]
}

function buildSlaRows(ubsRows: PrefeituraUbsRow[]): PrefeituraSlaRow[] {
  return [...ubsRows]
    .sort((a, b) => parseWaitMinutes(b.avgWait) - parseWaitMinutes(a.avgWait))
    .map((row) => ({
      unit: row.name,
      wait: row.avgWait,
      status: row.sla,
    }))
}

export function computePrefeituraDashboardView(
  filters: PrefeituraDashboardFilters,
): PrefeituraDashboardView {
  const ubsRows = filterUbsRows(filters)
  const filteredConsultations = ubsRows.reduce((sum, row) => sum + row.consultationsToday, 0)
  const shareRatio =
    BASE_NETWORK_CONSULTATIONS > 0 ? filteredConsultations / BASE_NETWORK_CONSULTATIONS : 0
  const periodMult = PERIOD_MULTIPLIER[filters.period] ?? 1

  const { specialties, specialtyTotal } = buildSpecialties(shareRatio, periodMult)
  const regions = buildRegionVolumes(ubsRows, periodMult, filters)
  const allAlerts = filterPrefeituraAlerts(filters, ubsRows)
  const alerts = allAlerts.slice(0, HIGHLIGHT_ALERTS_LIMIT)

  return {
    filterKey: `${filters.period}-${filters.region}-${filters.ubt}`,
    ubsRows,
    kpiCards: buildKpiCards(ubsRows, filters.period, periodMult, shareRatio),
    hourly: buildHourly(shareRatio, filters.period),
    regions,
    specialties,
    specialtyTotal,
    slaRows: buildSlaRows(ubsRows),
    alerts,
    allAlerts,
    packageUsage: computePrefeituraPackageUsage(filters, shareRatio),
    isEmpty: ubsRows.length === 0,
  }
}

function labelFromFilterOptions(
  options: readonly { value: string; label: string }[],
  value: string,
) {
  return options.find((item) => item.value === value)?.label ?? value
}

export function buildPrefeituraDashboardFilterSummary(
  filters: PrefeituraDashboardFilters,
): string[] {
  const period = labelFromFilterOptions(prefeituraFilterOptions.period, filters.period)
  const region = labelFromFilterOptions(prefeituraFilterOptions.region, filters.region)
  const ubt = labelFromFilterOptions(
    getPrefeituraDashboardUbtFilterOptions(filters.region),
    filters.ubt,
  )

  return [`Período: ${period}`, `Região: ${region}`, `UBT: ${ubt}`]
}

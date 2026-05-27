import type { AdminKpiDrillRow } from '../components/admin/dashboard/AdminKpiDrillDrawer'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'
import {
  adminDashboardFilterOptions,
  adminDashboardKpiBase,
  adminMunicipalities,
  adminNocCategoryLabels,
  adminNocIncidents,
  adminPlatformHourlyBase,
  type AdminKpiDrillKind,
  type AdminMunicipalityRow,
  type AdminNocIncident,
} from '../data/adminDashboardMock'
import { adminHealthLabels, formatAdminCurrency } from '../components/admin/dashboard/adminDashboardUi'
import type { PrefeituraHourlyPoint } from './prefeituraDashboardFilters'

export type AdminDashboardFilters = {
  period: string
  state: string
  contract: string
  health: string
}

export type AdminPlatformPackageView = {
  contractedTotal: number
  usedInCycle: number
  remainingInPackage: number
  usagePercent: number
  status: 'normal' | 'atencao' | 'critico'
}

export type AdminRevenueView = {
  packageTotal: number
  avulsoTotal: number
  grandTotal: number
}

export type AdminTerminalsView = {
  online: number
  offline: number
  maintenance: number
  total: number
}

export type AdminDashboardView = {
  filterKey: string
  municipalities: AdminMunicipalityRow[]
  nocIncidents: AdminNocIncident[]
  nocHighlight: AdminNocIncident[]
  openNocCount: number
  criticalNocCount: number
  kpiCards: KpiStatCardItem[]
  hourly: PrefeituraHourlyPoint[]
  packageUsage: AdminPlatformPackageView
  revenue: AdminRevenueView
  terminals: AdminTerminalsView
  avgSlaMinutes: number
  isEmpty: boolean
}

const PERIOD_MULTIPLIER: Record<string, number> = {
  hoje: 1,
  '7d': 6.2,
  '30d': 22,
}

const HIGHLIGHT_NOC_LIMIT = 5

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value))
}

function formatCurrencyShort(value: number) {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi`
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function parseSlaMinutes(sla: AdminMunicipalityRow['sla']) {
  if (sla === 'normal') return 9
  if (sla === 'atencao') return 14
  return 22
}

function filterMunicipalities(filters: AdminDashboardFilters) {
  return adminMunicipalities.filter((row) => {
    if (filters.state !== 'all' && row.stateKey !== filters.state) return false
    if (filters.contract !== 'all' && row.contractStatus !== filters.contract) return false
    if (filters.health !== 'all' && row.health !== filters.health) return false
    return true
  })
}

function filterNocByMunicipalities(
  incidents: AdminNocIncident[],
  municipalities: AdminMunicipalityRow[],
) {
  const ids = new Set(municipalities.map((m) => m.id))
  return incidents.filter((incident) => ids.has(incident.municipalityId))
}

function packageStatusFromPercent(percent: number): AdminPlatformPackageView['status'] {
  if (percent >= 95) return 'critico'
  if (percent >= 85) return 'atencao'
  return 'normal'
}

function buildKpiCards(
  municipalities: AdminMunicipalityRow[],
  nocOpen: AdminNocIncident[],
  periodMult: number,
  revenue: AdminRevenueView,
  terminals: AdminTerminalsView,
  avgSlaMinutes: number,
): KpiStatCardItem[] {
  const active = municipalities.filter((m) => m.contractStatus === 'active').length
  const expiring = municipalities.filter((m) => m.contractStatus === 'expiring').length
  const suspended = municipalities.filter((m) => m.contractStatus === 'suspended').length
  const consultationsToday = municipalities.reduce((s, m) => s + m.consultationsToday, 0)
  const consultationsMonth = municipalities.reduce((s, m) => s + m.consultationsMonth, 0)
  const criticalNoc = nocOpen.filter((n) => n.priority === 'critical').length

  const base = adminDashboardKpiBase

  return [
    {
      ...base[0],
      value: formatNumber(active),
      suffix: `${expiring} vencendo · ${suspended} suspensa${suspended === 1 ? '' : 's'}`,
    },
    {
      ...base[1],
      value: formatNumber(consultationsToday * periodMult),
      suffix: `Mês: ${formatNumber(consultationsMonth * (periodMult > 1 ? 1 : 1))}`,
    },
    {
      ...base[2],
      value: formatNumber(nocOpen.length),
      suffix: `${criticalNoc} crítico${criticalNoc === 1 ? '' : 's'} aberto${criticalNoc === 1 ? '' : 's'}`,
    },
    {
      ...base[3],
      value: `${Math.round(avgSlaMinutes)} min`,
      suffix: 'Meta interna: 15 min',
    },
    {
      ...base[4],
      value: `${formatNumber(terminals.online)} online`,
      suffix: `Offline: ${terminals.offline} · Manutenção: ${terminals.maintenance}`,
    },
    {
      ...base[5],
      value: formatCurrencyShort(revenue.grandTotal),
      suffix: 'Pacote + avulso no recorte',
    },
  ]
}

export function computeAdminDashboardView(filters: AdminDashboardFilters): AdminDashboardView {
  const municipalities = filterMunicipalities(filters)
  const periodMult = PERIOD_MULTIPLIER[filters.period] ?? 1
  const allNoc = filterNocByMunicipalities(adminNocIncidents, municipalities)
  const nocOpen = allNoc.filter((n) => n.status !== 'resolved')

  const contractedTotal = municipalities.reduce(
    (s, m) => s + Math.round(m.consultationsMonth / Math.max(m.packageUsagePercent / 100, 0.01)),
    0,
  )
  const usedInCycle = municipalities.reduce((s, m) => s + m.consultationsMonth, 0)
  const usagePercent =
    contractedTotal > 0 ? Math.min(102, Math.round((usedInCycle / contractedTotal) * 100)) : 0

  const packageUsage: AdminPlatformPackageView = {
    contractedTotal,
    usedInCycle,
    remainingInPackage: Math.max(0, contractedTotal - usedInCycle),
    usagePercent,
    status: packageStatusFromPercent(usagePercent),
  }

  const revenue: AdminRevenueView = {
    packageTotal: municipalities.reduce((s, m) => s + m.revenuePackage, 0),
    avulsoTotal: municipalities.reduce((s, m) => s + m.revenueAvulso, 0),
    grandTotal: 0,
  }
  revenue.grandTotal = revenue.packageTotal + revenue.avulsoTotal

  const terminals: AdminTerminalsView = municipalities.reduce(
    (acc, m) => ({
      online: acc.online + m.terminalsOnline,
      offline: acc.offline + m.terminalsOffline,
      maintenance: acc.maintenance + m.terminalsMaintenance,
      total: acc.total + m.terminalsTotal,
    }),
    { online: 0, offline: 0, maintenance: 0, total: 0 },
  )

  const avgSlaMinutes =
    municipalities.length > 0
      ? municipalities.reduce((s, m) => s + parseSlaMinutes(m.sla), 0) / municipalities.length
      : 0

  const scale = municipalities.length / Math.max(adminMunicipalities.length, 1)
  const hourly = adminPlatformHourlyBase.map((point) => ({
    hour: point.hour,
    value: Math.round(point.value * scale * periodMult),
  }))

  const nocHighlight = [...nocOpen]
    .sort((a, b) => {
      const priorityRank = { critical: 0, high: 1, medium: 2 }
      return priorityRank[a.priority] - priorityRank[b.priority]
    })
    .slice(0, HIGHLIGHT_NOC_LIMIT)

  const filterKey = [filters.period, filters.state, filters.contract, filters.health].join('|')

  return {
    filterKey,
    municipalities,
    nocIncidents: allNoc,
    nocHighlight,
    openNocCount: nocOpen.length,
    criticalNocCount: nocOpen.filter((n) => n.priority === 'critical').length,
    kpiCards: buildKpiCards(
      municipalities,
      nocOpen,
      periodMult,
      revenue,
      terminals,
      avgSlaMinutes,
    ),
    hourly,
    packageUsage,
    revenue,
    terminals,
    avgSlaMinutes,
    isEmpty: municipalities.length === 0,
  }
}

export function buildAdminDashboardFilterSummary(filters: AdminDashboardFilters): string[] {
  const period =
    adminDashboardFilterOptions.period.find((o) => o.value === filters.period)?.label ??
    filters.period
  const state =
    adminDashboardFilterOptions.state.find((o) => o.value === filters.state)?.label ??
    filters.state
  const contract =
    adminDashboardFilterOptions.contract.find((o) => o.value === filters.contract)?.label ??
    filters.contract
  const health =
    adminDashboardFilterOptions.health.find((o) => o.value === filters.health)?.label ??
    filters.health

  return [`Período: ${period}`, `Estado: ${state}`, `Contrato: ${contract}`, `Semáforo: ${health}`]
}

export function kpiIndexToDrillKind(index: number): AdminKpiDrillKind {
  const kinds: AdminKpiDrillKind[] = [
    'prefeituras',
    'consultas',
    'noc',
    'sla',
    'terminais',
    'receita',
  ]
  return kinds[index] ?? 'prefeituras'
}

const contractLabels = {
  active: 'Ativo',
  expiring: 'Vencendo',
  suspended: 'Suspenso',
} as const

const slaLabels = {
  normal: 'Normal',
  atencao: 'Atenção',
  critico: 'Crítico',
} as const

export function buildAdminKpiDrillRows(
  kind: AdminKpiDrillKind,
  view: AdminDashboardView,
): AdminKpiDrillRow[] {
  const { municipalities, nocIncidents } = view

  switch (kind) {
    case 'prefeituras':
      return municipalities.map((m) => ({
        label: m.name,
        value: contractLabels[m.contractStatus],
        detail: `${m.state} · ${adminHealthLabels[m.health]}`,
      }))
    case 'consultas':
      return municipalities.map((m) => ({
        label: m.name,
        value: formatNumber(m.consultationsToday),
        detail: `Mês: ${formatNumber(m.consultationsMonth)}`,
      }))
    case 'pacote':
      return municipalities.map((m) => ({
        label: m.name,
        value: `${m.packageUsagePercent}%`,
        detail: m.packageUsagePercent >= 90 ? 'Acima de 90%' : 'Dentro da meta',
      }))
    case 'noc':
      return nocIncidents
        .filter((n) => n.status !== 'resolved')
        .map((n) => ({
          label: n.title,
          value: adminNocCategoryLabels[n.category],
          detail: `${n.municipality} · ${n.assignee ?? 'Sem responsável'}`,
        }))
    case 'sla':
      return municipalities.map((m) => ({
        label: m.name,
        value: slaLabels[m.sla],
        detail: m.state,
      }))
    case 'terminais':
      return municipalities.map((m) => ({
        label: m.name,
        value: `${m.terminalsOnline} online`,
        detail: `Offline ${m.terminalsOffline} · Manutenção ${m.terminalsMaintenance}`,
      }))
    case 'receita':
      return municipalities.map((m) => ({
        label: m.name,
        value: formatAdminCurrency(m.revenuePackage + m.revenueAvulso),
        detail: `Pacote ${formatAdminCurrency(m.revenuePackage)} · Avulso ${formatAdminCurrency(m.revenueAvulso)}`,
      }))
    case 'saude':
      return municipalities.map((m) => ({
        label: m.name,
        value: adminHealthLabels[m.health],
        detail: `${m.openNocCount} incidente(s) em aberto`,
      }))
    default:
      return []
  }
}

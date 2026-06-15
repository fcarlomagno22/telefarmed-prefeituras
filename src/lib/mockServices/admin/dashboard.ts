import {
  AlertTriangle,
  Building2,
  ClipboardList,
  DollarSign,
  Monitor,
  Timer,
} from 'lucide-react'
import type { KpiStatCardItem } from '../../../components/ui/KpiStatCards'
import { adminClientesRows } from '../../../data/adminClientesMock'
import { adminPlatformHourlyBase, adminNocIncidents } from '../../../data/adminDashboardMock'
import { buildMockAdminDashboardTriageCharts } from '../../../data/adminDashboardTriageMock'
import {
  adminDashboardFilterOptions,
  getAdminMunicipalityCityFilterOptions,
  type AdminMunicipalityRow,
  type AdminNocIncident,
} from '../../../types/adminDashboard'
import { formatAdminCurrencyCompact } from '../../../components/admin/dashboard/adminDashboardUi'
import type {
  AdminDashboardView,
  AdminPlatformPackageView,
  AdminRevenueView,
  AdminTerminalsView,
} from '../../../utils/adminDashboardFilters'
import type { AdminKpiDrillKind } from '../../../types/adminDashboard'
import type { AdminDashboardTriageChartsView } from '../../../types/adminDashboardTriage'
import { EMPTY_ADMIN_DASHBOARD_TRIAGE_CHARTS } from '../../../types/adminDashboardTriage'
import { mockDelay } from '../delay'

export class AdminDashboardApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminDashboardApiError'
    this.status = status
    this.code = code
  }
}

export function isAdminDashboardApiError(error: unknown): error is AdminDashboardApiError {
  return error instanceof AdminDashboardApiError
}

const KPI_ICONS: Record<string, KpiStatCardItem['icon']> = {
  prefeituras: Building2,
  consultas: ClipboardList,
  noc: AlertTriangle,
  sla: Timer,
  terminais: Monitor,
  receita: DollarSign,
}

const KPI_STYLES: Record<
  string,
  Pick<KpiStatCardItem, 'iconGradient' | 'iconShadow' | 'iconRing'>
> = {
  prefeituras: {
    iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
    iconRing: 'ring-blue-100/80',
  },
  consultas: {
    iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
    iconRing: 'ring-emerald-100/80',
  },
  noc: {
    iconGradient: 'from-rose-500 via-red-500 to-red-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
    iconRing: 'ring-red-100/80',
  },
  sla: {
    iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
    iconRing: 'ring-orange-100/80',
  },
  terminais: {
    iconGradient: 'from-teal-500 via-cyan-500 to-sky-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(20,184,166,0.35)]',
    iconRing: 'ring-teal-100/80',
  },
  receita: {
    iconGradient: 'from-amber-500 via-yellow-500 to-orange-500',
    iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.35)]',
    iconRing: 'ring-amber-100/80',
  },
}

type DashboardOverviewApi = {
  filterKey: string
  municipalities: AdminMunicipalityRow[]
  nocIncidents: AdminNocIncident[]
  nocHighlight: AdminNocIncident[]
  openNocCount: number
  criticalNocCount: number
  kpis: Array<{ key: string; label: string; value: string; suffix: string; topBar: string }>
  hourly: Array<{ hour: string; value: number }>
  packageUsage: AdminPlatformPackageView
  revenue: AdminRevenueView
  terminals: AdminTerminalsView
  avgSlaMinutes: number
  triageCharts: AdminDashboardTriageChartsView
  isEmpty: boolean
  filterOptions: {
    period: Array<{ value: string; label: string }>
    state: Array<{ value: string; label: string }>
    city: Array<{ value: string; label: string }>
    contract: Array<{ value: string; label: string }>
    health: Array<{ value: string; label: string }>
  }
}

function mapKpisToCards(kpis: DashboardOverviewApi['kpis']): KpiStatCardItem[] {
  return kpis.map((kpi) => ({
    label: kpi.label,
    value: kpi.value,
    suffix: kpi.suffix,
    topBar: kpi.topBar,
    icon: KPI_ICONS[kpi.key] ?? Building2,
    iconGradient: KPI_STYLES[kpi.key]?.iconGradient ?? KPI_STYLES.prefeituras.iconGradient,
    iconShadow: KPI_STYLES[kpi.key]?.iconShadow ?? KPI_STYLES.prefeituras.iconShadow,
    iconRing: KPI_STYLES[kpi.key]?.iconRing ?? KPI_STYLES.prefeituras.iconRing,
  }))
}

function mapStatusToContract(status: string): AdminMunicipalityRow['contractStatus'] {
  if (status === 'suspensa') return 'suspended'
  if (status === 'implantacao' || status === 'prospect') return 'expiring'
  return 'active'
}

function stateKeyFromUf(uf: string): AdminMunicipalityRow['stateKey'] {
  if (uf === 'DF') return 'df'
  if (uf === 'GO') return 'go'
  if (uf === 'MG') return 'mg'
  return 'sp'
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function buildOverview(params: AdminDashboardFiltersParams): DashboardOverviewApi {
  const municipalities: AdminMunicipalityRow[] = adminClientesRows.map((cliente, index) => {
    const activeContracts = cliente.contratos.filter((c) => c.status === 'ativo').length
    const consultationsToday = 20 + index * 6
    const terminalsOnline = 4 + (index % 3)
    const terminalsMaintenance = index % 7 === 0 ? 1 : 0
    const terminalsTotal = terminalsOnline + terminalsMaintenance + (index % 5 === 0 ? 1 : 0)
    const terminalsOffline = Math.max(0, terminalsTotal - terminalsOnline - terminalsMaintenance)
    const packageUsagePercent = cliente.contratos[0]?.percentualUtilizado ?? 0

    return {
      id: cliente.id,
      name: cliente.prefeitura,
      state: cliente.uf,
      stateKey: stateKeyFromUf(cliente.uf),
      contractStatus: mapStatusToContract(cliente.status),
      health: packageUsagePercent > 95 ? 'red' : packageUsagePercent > 80 ? 'yellow' : 'green',
      consultationsToday,
      consultationsMonth: consultationsToday * 22,
      packageUsagePercent,
      sla: packageUsagePercent > 90 ? 'atencao' : 'normal',
      terminalsOnline,
      terminalsOffline,
      terminalsMaintenance,
      terminalsTotal,
      openNocCount: 0,
      revenuePackage: activeContracts * 140_000,
      revenueAvulso: (cliente.contratos[0]?.consultasRealizadas ?? 0) * 118,
    }
  })

  const filtered = municipalities.filter((row) => {
    if (params.state && params.state !== 'all' && row.stateKey !== params.state) return false
    if (params.city && params.city !== 'all' && row.id !== params.city) return false
    if (params.contract && params.contract !== 'all' && row.contractStatus !== params.contract) return false
    if (params.health && params.health !== 'all' && row.health !== params.health) return false
    return true
  })

  const terminals = filtered.reduce(
    (acc, row) => {
      acc.online += row.terminalsOnline
      acc.offline += row.terminalsOffline
      acc.maintenance += row.terminalsMaintenance
      acc.total += row.terminalsTotal
      return acc
    },
    { online: 0, offline: 0, maintenance: 0, total: 0 } satisfies AdminTerminalsView,
  )

  const packageUsage = filtered.reduce(
    (acc, row) => {
      acc.contractedTotal += 5_000
      acc.usedInCycle += Math.round((row.packageUsagePercent / 100) * 5_000)
      return acc
    },
    { contractedTotal: 0, usedInCycle: 0, remainingInPackage: 0, usagePercent: 0, status: 'normal' } as AdminPlatformPackageView,
  )
  packageUsage.remainingInPackage = Math.max(0, packageUsage.contractedTotal - packageUsage.usedInCycle)
  packageUsage.usagePercent = packageUsage.contractedTotal
    ? Math.round((packageUsage.usedInCycle / packageUsage.contractedTotal) * 100)
    : 0
  packageUsage.status =
    packageUsage.usagePercent > 95 ? 'critico' : packageUsage.usagePercent > 80 ? 'atencao' : 'normal'

  const revenue = filtered.reduce(
    (acc, row) => {
      acc.packageTotal += row.revenuePackage
      acc.avulsoTotal += row.revenueAvulso
      return acc
    },
    { packageTotal: 0, avulsoTotal: 0, grandTotal: 0 } satisfies AdminRevenueView,
  )
  revenue.grandTotal = revenue.packageTotal + revenue.avulsoTotal

  const openNocCount = adminNocIncidents.filter((incident) => incident.status !== 'resolved').length
  const criticalNocCount = adminNocIncidents.filter((incident) => incident.priority === 'critical').length

  const kpis = [
    {
      key: 'prefeituras',
      label: 'Prefeituras',
      value: String(filtered.length),
      suffix: 'ativas na visão',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      key: 'consultas',
      label: 'Consultas hoje',
      value: String(filtered.reduce((sum, row) => sum + row.consultationsToday, 0)),
      suffix: 'atendimentos',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      key: 'noc',
      label: 'Incidentes NOC',
      value: String(openNocCount),
      suffix: 'em aberto',
      topBar: 'from-rose-400 to-red-500',
    },
    {
      key: 'sla',
      label: 'SLA médio',
      value: '16',
      suffix: 'min',
      topBar: 'from-amber-400 to-orange-500',
    },
    {
      key: 'terminais',
      label: 'Terminais',
      value: String(terminals.online),
      suffix: `online de ${terminals.total}`,
      topBar: 'from-teal-400 to-cyan-500',
    },
    {
      key: 'receita',
      label: 'Receita',
      value: formatAdminCurrencyCompact(revenue.grandTotal, { withSymbol: false }),
      suffix: 'estimada',
      topBar: 'from-amber-400 to-yellow-500',
    },
  ]

  const consultationVolume = filtered.reduce((sum, row) => sum + row.consultationsToday, 0)

  return {
    filterKey: `${params.period ?? 'hoje'}:${params.state ?? 'all'}:${params.city ?? 'all'}:${params.contract ?? 'all'}:${params.health ?? 'all'}`,
    municipalities: filtered,
    nocIncidents: clone(adminNocIncidents),
    nocHighlight: clone(adminNocIncidents.slice(0, 3)),
    openNocCount,
    criticalNocCount,
    kpis,
    hourly: clone(adminPlatformHourlyBase),
    packageUsage,
    revenue,
    terminals,
    avgSlaMinutes: 16,
    triageCharts: buildMockAdminDashboardTriageCharts(consultationVolume),
    isEmpty: filtered.length === 0,
    filterOptions: {
      period: [...adminDashboardFilterOptions.period],
      state: [...adminDashboardFilterOptions.state],
      city: getAdminMunicipalityCityFilterOptions(municipalities, params.state ?? 'all'),
      contract: [...adminDashboardFilterOptions.contract],
      health: [...adminDashboardFilterOptions.health],
    },
  }
}

export function mapOverviewToAdminDashboardView(overview: DashboardOverviewApi): AdminDashboardView {
  return {
    filterKey: overview.filterKey,
    municipalities: overview.municipalities,
    nocIncidents: overview.nocIncidents,
    nocHighlight: overview.nocHighlight,
    openNocCount: overview.openNocCount,
    criticalNocCount: overview.criticalNocCount,
    kpiCards: mapKpisToCards(overview.kpis),
    hourly: overview.hourly,
    packageUsage: overview.packageUsage,
    revenue: overview.revenue,
    terminals: overview.terminals,
    avgSlaMinutes: overview.avgSlaMinutes,
    triageCharts: overview.triageCharts ?? EMPTY_ADMIN_DASHBOARD_TRIAGE_CHARTS,
    isEmpty: overview.isEmpty,
    filterOptions: overview.filterOptions,
  }
}

export type AdminDashboardFiltersParams = {
  period?: string
  state?: string
  city?: string
  contract?: string
  health?: string
}

export async function fetchAdminDashboardOverview(
  _accessToken: string,
  params: AdminDashboardFiltersParams = {},
) {
  return mockDelay(buildOverview(params), 80)
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

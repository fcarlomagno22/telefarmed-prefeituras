import {
  AlertTriangle,
  Building2,
  ClipboardList,
  DollarSign,
  Monitor,
  Timer,
} from 'lucide-react'
import type { KpiStatCardItem } from '../../../components/ui/KpiStatCards'
import type { AdminKpiDrillKind } from '../../../types/adminDashboard'
import { EMPTY_ADMIN_DASHBOARD_TRIAGE_CHARTS } from '../../../types/adminDashboardTriage'
import type { AdminDashboardView } from '../../../utils/adminDashboardFilters'
import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/dashboard'
import * as mock from '../../mockServices/admin/dashboard'

const useApi = isBackendApiEnabled()

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

export type AdminDashboardFiltersParams = mock.AdminDashboardFiltersParams

export const AdminDashboardApiError = useApi ? api.AdminDashboardApiError : mock.AdminDashboardApiError

export const isAdminDashboardApiError = useApi
  ? api.isAdminDashboardApiError
  : mock.isAdminDashboardApiError

function mapKpisToCards(
  kpis: Array<{ key: string; label: string; value: string; suffix: string; topBar: string }>,
): KpiStatCardItem[] {
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

export function mapOverviewToAdminDashboardView(
  overview: Parameters<typeof mock.mapOverviewToAdminDashboardView>[0],
): AdminDashboardView {
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

export async function fetchAdminDashboardOverview(
  accessToken: string,
  params: AdminDashboardFiltersParams = {},
) {
  if (!useApi) {
    return mock.fetchAdminDashboardOverview(accessToken, params)
  }
  return api.fetchAdminDashboardOverview(accessToken, params)
}

export async function updateAdminDashboardNocIncident(
  accessToken: string,
  incidentId: string,
  body: api.AdminDashboardNocPatchParams,
) {
  if (!useApi) {
    return null
  }
  const result = await api.patchAdminDashboardNocIncident(accessToken, incidentId, body)
  return result.incident
}

export function kpiIndexToDrillKind(index: number): AdminKpiDrillKind {
  return mock.kpiIndexToDrillKind(index)
}

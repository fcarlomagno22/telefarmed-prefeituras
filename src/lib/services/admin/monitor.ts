import {
  Activity,
  AlertTriangle,
  Clock3,
  Search,
  ShieldAlert,
  Users,
} from 'lucide-react'
import type { KpiStatCardItem } from '../../../components/ui/KpiStatCards'
import type { AdminMonitorView } from '../../../types/adminMonitor'
import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/monitor'
import * as mock from '../../mockServices/admin/monitor'

const useApi = isBackendApiEnabled()

const KPI_ICONS: Record<string, KpiStatCardItem['icon']> = {
  ubts: Activity,
  em_curso: Users,
  aguardando: Clock3,
  filas_criticas: AlertTriangle,
  sla_ocupacao: ShieldAlert,
  no_show: Search,
}

const KPI_STYLES: Record<
  string,
  Pick<KpiStatCardItem, 'iconGradient' | 'iconShadow' | 'iconRing'>
> = {
  ubts: {
    iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
    iconRing: 'ring-blue-100/80',
  },
  em_curso: {
    iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
    iconRing: 'ring-emerald-100/80',
  },
  aguardando: {
    iconGradient: 'from-amber-500 via-orange-500 to-red-500',
    iconShadow: 'shadow-[0_8px_20px_rgba(251,146,60,0.35)]',
    iconRing: 'ring-orange-100/80',
  },
  filas_criticas: {
    iconGradient: 'from-rose-500 via-red-500 to-red-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
    iconRing: 'ring-red-100/80',
  },
  sla_ocupacao: {
    iconGradient: 'from-violet-500 via-purple-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
    iconRing: 'ring-violet-100/80',
  },
  no_show: {
    iconGradient: 'from-amber-500 via-yellow-500 to-orange-500',
    iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.35)]',
    iconRing: 'ring-amber-100/80',
  },
}

export type AdminMonitorPageData = AdminMonitorView & {
  kpiCards: KpiStatCardItem[]
}

export type AdminMonitorQueryParams = mock.AdminMonitorQueryParams

export const AdminMonitorApiError = useApi ? api.AdminMonitorApiError : mock.AdminMonitorApiError

export const isAdminMonitorApiError = useApi ? api.isAdminMonitorApiError : mock.isAdminMonitorApiError

function mapKpisToCards(
  kpis: Array<{ key: string; label: string; value: string; suffix: string; topBar: string }>,
): KpiStatCardItem[] {
  return kpis.map((kpi) => ({
    label: kpi.label,
    value: kpi.value,
    suffix: kpi.suffix,
    topBar: kpi.topBar,
    icon: KPI_ICONS[kpi.key] ?? Activity,
    iconGradient: KPI_STYLES[kpi.key]?.iconGradient ?? KPI_STYLES.ubts.iconGradient,
    iconShadow: KPI_STYLES[kpi.key]?.iconShadow ?? KPI_STYLES.ubts.iconShadow,
    iconRing: KPI_STYLES[kpi.key]?.iconRing ?? KPI_STYLES.ubts.iconRing,
  }))
}

function mapOverviewToPageData(
  overview: AdminMonitorView & {
    kpis: Array<{ key: string; label: string; value: string; suffix: string; topBar: string }>
  },
): AdminMonitorPageData {
  const { kpis, ...rest } = overview
  return {
    ...rest,
    kpiCards: mapKpisToCards(kpis),
  }
}

export async function fetchAdminMonitorOverview(
  accessToken: string,
  params: AdminMonitorQueryParams = {},
): Promise<AdminMonitorPageData> {
  if (!useApi) {
    return mock.fetchAdminMonitorOverview(accessToken, params)
  }

  const overview = await api.fetchAdminMonitorOverview(accessToken, params)
  return mapOverviewToPageData(overview)
}

export async function fetchAdminMonitorConsultasLive(
  accessToken: string,
  params: AdminMonitorQueryParams = {},
) {
  if (!useApi) {
    return mock.fetchAdminMonitorConsultasLive(accessToken, params)
  }
  const overview = await api.fetchAdminMonitorOverview(accessToken, params)
  return overview.consultasLive
}

export async function fetchAdminMonitorAlertas(
  accessToken: string,
  params: AdminMonitorQueryParams = {},
) {
  if (!useApi) {
    return mock.fetchAdminMonitorAlertas(accessToken, params)
  }
  const overview = await api.fetchAdminMonitorOverview(accessToken, params)
  return overview.alerts
}

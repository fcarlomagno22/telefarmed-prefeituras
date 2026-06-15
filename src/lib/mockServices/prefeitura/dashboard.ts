import {
  ClipboardList,
  Clock,
  Monitor,
  UserRound,
  Users,
  UserX,
} from 'lucide-react'
import type { KpiStatCardItem } from '../../../components/ui/KpiStatCards'
import {
  prefeituraFilterOptions,
  prefeituraHourlyConsultations,
  prefeituraRegionVolumes,
} from '../../../data/prefeituraDashboardMock'
import { prefeituraRedeUnits } from '../../../data/prefeituraRedeMock'
import { buildPrefeituraRedeUnitFullDetail } from '../../../data/prefeituraRedeUnitDetail'
import { buildMockAdminDashboardTriageCharts } from '../../../data/adminDashboardTriageMock'
import { prefeituraSpecialtyStats } from '../../../data/prefeituraSpecialtyStats'
import type { AdminDashboardTriageChartsView } from '../../../types/adminDashboardTriage'
import { EMPTY_ADMIN_DASHBOARD_TRIAGE_CHARTS } from '../../../types/adminDashboardTriage'
import type {
  PrefeituraAlert,
  PrefeituraDashboardFilterOptions,
  PrefeituraHourlyPoint,
  PrefeituraRegionVolume,
  PrefeituraSlaRow,
  PrefeituraSpecialtyStat,
  PrefeituraUbsRow,
} from '../../../types/prefeituraDashboard'
import type { PrefeituraPackageUsageView } from '../../../utils/prefeituraConsultationPackage'
import { computePrefeituraPackageUsage } from '../../../utils/prefeituraConsultationPackage'
import { mockDelay } from '../delay'

export class PrefeituraDashboardApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PrefeituraDashboardApiError'
    this.status = status
    this.code = code
  }
}

const KPI_ICONS: Record<string, KpiStatCardItem['icon']> = {
  consultations: ClipboardList,
  queue: Users,
  professionals_online: UserRound,
  terminals: Monitor,
  absences: UserX,
  avg_wait: Clock,
}

const KPI_STYLES: Record<
  string,
  Pick<KpiStatCardItem, 'iconGradient' | 'iconShadow' | 'iconRing'>
> = {
  consultations: {
    iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
    iconRing: 'ring-emerald-100/80',
  },
  queue: {
    iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
    iconRing: 'ring-orange-100/80',
  },
  professionals_online: {
    iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
    iconRing: 'ring-blue-100/80',
  },
  terminals: {
    iconGradient: 'from-teal-500 via-cyan-500 to-sky-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(20,184,166,0.35)]',
    iconRing: 'ring-teal-100/80',
  },
  absences: {
    iconGradient: 'from-rose-500 via-red-500 to-orange-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(244,63,94,0.35)]',
    iconRing: 'ring-rose-100/80',
  },
  avg_wait: {
    iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
    iconRing: 'ring-violet-100/80',
  },
}

type DashboardOverviewApi = {
  kpis: Array<{ key: string; label: string; value: string; suffix: string; topBar: string }>
  ubsRows: PrefeituraUbsRow[]
  hourly: PrefeituraHourlyPoint[]
  regions: PrefeituraRegionVolume[]
  specialties: PrefeituraSpecialtyStat[]
  specialtyTotal: number
  slaRows: PrefeituraSlaRow[]
  alerts: PrefeituraAlert[]
  allAlerts: PrefeituraAlert[]
  triageCharts: AdminDashboardTriageChartsView
  filterOptions: PrefeituraDashboardFilterOptions
  isEmpty: boolean
}

export type PrefeituraDashboardOverviewData = DashboardOverviewApi

function clone<T>(value: T): T {
  return structuredClone(value)
}

function buildUbsRows(regionKey: string, unidadeUbtId?: string): PrefeituraUbsRow[] {
  let units = prefeituraRedeUnits.filter((unit) => unit.status !== 'inativa')
  if (regionKey !== 'todas') {
    const normalized = regionKey === 'central' ? 'centro' : regionKey
    units = units.filter((unit) => unit.regionKey === normalized)
  }
  if (unidadeUbtId && unidadeUbtId !== 'todas') {
    units = units.filter((unit) => unit.id === unidadeUbtId)
  }
  return units.map((unit) => ({
    ...buildPrefeituraRedeUnitFullDetail(unit).metrics.unit,
    id: unit.id,
  }))
}

function buildAlerts(rows: PrefeituraUbsRow[]): PrefeituraAlert[] {
  return rows
    .filter((row) => row.sla !== 'normal')
    .slice(0, 6)
    .map((row, index) => ({
      id: `alert-${row.id}`,
      title: row.sla === 'critico' ? 'Unidade com SLA crítico' : 'Fila em atenção',
      unit: row.name,
      timeAgo: `há ${5 + index * 3} min`,
      severity: row.sla === 'critico' ? 'critical' : 'warning',
      regionKey: row.regionKey,
      category: row.sla === 'critico' ? 'Conectividade' : 'Fila',
      description:
        row.sla === 'critico'
          ? 'Tempo de espera ou indisponibilidade acima do limite municipal.'
          : 'Demanda acima da média na unidade.',
      impact: 'Pacientes aguardando atendimento com atraso.',
      recommendedAction: 'Acionar responsável da UBT e revisar capacidade de terminais.',
      detectedAt: new Date().toISOString(),
      status: 'open' as const,
    }))
}

function buildOverview(params: {
  period: string
  regionKey: string
  unidadeUbtId?: string
}): DashboardOverviewApi {
  const ubsRows = buildUbsRows(params.regionKey, params.unidadeUbtId)

  const consultationsToday = ubsRows.reduce((sum, row) => sum + row.consultationsToday, 0)
  const queueNow = ubsRows.reduce((sum, row) => sum + row.queueNow, 0)
  const terminalsOnline = prefeituraRedeUnits
    .filter((unit) => ubsRows.some((row) => row.name === unit.name))
    .reduce((sum, unit) => sum + unit.stationsOnline, 0)
  const terminalsTotal = prefeituraRedeUnits
    .filter((unit) => ubsRows.some((row) => row.name === unit.name))
    .reduce((sum, unit) => sum + unit.stationsTotal, 0)
  const absencesToday = ubsRows.reduce((sum, row) => sum + row.absencesToday, 0)

  const hourly: PrefeituraHourlyPoint[] =
    prefeituraHourlyConsultations.length > 0
      ? clone(prefeituraHourlyConsultations)
      : ['08h', '10h', '12h', '14h', '16h', '18h'].map((hour, index) => ({
          hour,
          value: Math.round((consultationsToday / 6) * (0.7 + index * 0.08)),
        }))

  const regions: PrefeituraRegionVolume[] =
    prefeituraRegionVolumes.length > 0
      ? clone(prefeituraRegionVolumes)
      : [
          { key: 'centro', label: 'Centro', value: 28, gradientFrom: '#3b82f6', gradientTo: '#6366f1' },
          { key: 'norte', label: 'Norte', value: 22, gradientFrom: '#10b981', gradientTo: '#14b8a6' },
          { key: 'sul', label: 'Sul', value: 18, gradientFrom: '#f97316', gradientTo: '#fb923c' },
          { key: 'leste', label: 'Leste', value: 16, gradientFrom: '#8b5cf6', gradientTo: '#a855f7' },
          { key: 'oeste', label: 'Oeste', value: 14, gradientFrom: '#ec4899', gradientTo: '#f43f5e' },
        ]

  const specialties = clone(prefeituraSpecialtyStats)
  const specialtyTotal = specialties.reduce((sum, item) => sum + item.count, 0)
  const alerts = buildAlerts(ubsRows)

  const kpis = [
    {
      key: 'consultations',
      label: 'Consultas hoje',
      value: String(consultationsToday),
      suffix: 'na rede filtrada',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      key: 'queue',
      label: 'Fila agora',
      value: String(queueNow),
      suffix: 'pacientes aguardando',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      key: 'professionals_online',
      label: 'Profissionais online',
      value: '0',
      suffix: 'de saúde em plantão',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      key: 'terminals',
      label: 'Terminais',
      value: String(terminalsOnline),
      suffix: `online de ${terminalsTotal}`,
      topBar: 'from-teal-400 to-cyan-500',
    },
    {
      key: 'absences',
      label: 'Faltas hoje',
      value: String(absencesToday),
      suffix: 'no recorte',
      topBar: 'from-rose-400 to-red-500',
    },
    {
      key: 'avg_wait',
      label: 'Espera média',
      value: '14',
      suffix: 'min',
      topBar: 'from-violet-400 to-purple-500',
    },
  ]

  const ubtOptions = [
    { value: 'todas', label: 'Todas as UBTs' },
    ...ubsRows.map((row) => ({ value: row.id, label: row.name })),
  ]

  return {
    kpis,
    ubsRows,
    hourly,
    regions,
    specialties,
    specialtyTotal,
    slaRows: ubsRows.slice(0, 8).map((row) => ({
      unit: row.name,
      wait: row.avgWait,
      status: row.sla,
    })),
    alerts: alerts.slice(0, 3),
    allAlerts: alerts,
    triageCharts: buildMockAdminDashboardTriageCharts(consultationsToday),
    filterOptions: {
      period: [...prefeituraFilterOptions.period],
      region: [...prefeituraFilterOptions.region],
      ubt: ubtOptions,
    },
    isEmpty: ubsRows.length === 0,
  }
}

export function isPrefeituraDashboardApiError(error: unknown): error is PrefeituraDashboardApiError {
  return error instanceof PrefeituraDashboardApiError
}

export function mapOverviewKpisToCards(
  kpis: DashboardOverviewApi['kpis'],
): KpiStatCardItem[] {
  return kpis.map((kpi) => ({
    label: kpi.label,
    value: kpi.value,
    suffix: kpi.suffix,
    topBar: kpi.topBar,
    icon: KPI_ICONS[kpi.key] ?? ClipboardList,
    iconGradient: KPI_STYLES[kpi.key]?.iconGradient ?? KPI_STYLES.consultations.iconGradient,
    iconShadow: KPI_STYLES[kpi.key]?.iconShadow ?? KPI_STYLES.consultations.iconShadow,
    iconRing: KPI_STYLES[kpi.key]?.iconRing ?? KPI_STYLES.consultations.iconRing,
  }))
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
  triageCharts: AdminDashboardTriageChartsView
  packageUsage: PrefeituraPackageUsageView
  isEmpty: boolean
  filterOptions: PrefeituraDashboardFilterOptions
}

export function mapOverviewToDashboardView(
  overview: PrefeituraDashboardOverviewData,
  filterKey: string,
): Omit<PrefeituraDashboardView, 'packageUsage'> {
  return {
    filterKey,
    ubsRows: overview.ubsRows,
    kpiCards: mapOverviewKpisToCards(overview.kpis),
    hourly: overview.hourly,
    regions: overview.regions,
    specialties: overview.specialties,
    specialtyTotal: overview.specialtyTotal,
    slaRows: overview.slaRows,
    alerts: overview.alerts,
    allAlerts: overview.allAlerts,
    triageCharts: overview.triageCharts ?? EMPTY_ADMIN_DASHBOARD_TRIAGE_CHARTS,
    isEmpty: overview.isEmpty,
    filterOptions: overview.filterOptions,
  }
}

export function computeMockPrefeituraPackageUsage(params: {
  period: string
  regionKey: string
  unidadeUbtId?: string
}): PrefeituraPackageUsageView {
  const ubsRows = buildUbsRows(params.regionKey, params.unidadeUbtId)
  const shareRatio =
    ubsRows.length / Math.max(1, prefeituraRedeUnits.filter((u) => u.status !== 'inativa').length)

  return computePrefeituraPackageUsage(
    { period: params.period, region: params.regionKey, ubt: params.unidadeUbtId ?? 'todas' },
    shareRatio,
  )
}

export async function fetchPrefeituraDashboardOverview(
  _accessToken: string,
  params: { period: string; regionKey: string; unidadeUbtId?: string },
) {
  void _accessToken
  return mockDelay(buildOverview(params), 70)
}

import type { AdminKpiDrillRow } from '../components/admin/dashboard/AdminKpiDrillDrawer'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'
import {
  adminDashboardFilterOptions,
  adminNocCategoryLabels,
  type AdminKpiDrillKind,
  type AdminMunicipalityRow,
  type AdminNocIncident,
} from '../types/adminDashboard'
import { adminHealthLabels, formatAdminCurrency } from '../components/admin/dashboard/adminDashboardUi'
import type { PrefeituraHourlyPoint } from './prefeituraDashboardFilters'

export type AdminDashboardFilters = {
  period: string
  state: string
  city: string
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
  filterOptions?: {
    period: Array<{ value: string; label: string }>
    state: Array<{ value: string; label: string }>
    city: Array<{ value: string; label: string }>
    contract: Array<{ value: string; label: string }>
    health: Array<{ value: string; label: string }>
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value))
}

export function buildAdminDashboardFilterSummary(filters: AdminDashboardFilters): string[] {
  const period =
    adminDashboardFilterOptions.period.find((o) => o.value === filters.period)?.label ??
    filters.period
  const state =
    adminDashboardFilterOptions.state.find((o) => o.value === filters.state)?.label ??
    filters.state
  const city =
    filters.city === 'all'
      ? 'Todas as cidades'
      : filters.city
  const contract =
    adminDashboardFilterOptions.contract.find((o) => o.value === filters.contract)?.label ??
    filters.contract
  const health =
    adminDashboardFilterOptions.health.find((o) => o.value === filters.health)?.label ??
    filters.health

  return [`Período: ${period}`, `Estado: ${state}`, `Cidade: ${city}`, `Contrato: ${contract}`, `Semáforo: ${health}`]
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

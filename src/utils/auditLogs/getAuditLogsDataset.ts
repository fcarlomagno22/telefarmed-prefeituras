import {
  AUDIT_LOGS_PAGINATION_TOTAL_ADMIN,
  AUDIT_LOGS_PAGINATION_TOTAL_PREFEITURA,
  AUDIT_LOGS_PAGINATION_TOTAL_UBT,
  auditLogsByTypeAdmin,
  auditLogsByTypePrefeitura,
  auditLogsByTypeUbt,
  auditLogsCriticalBreakdownAdmin,
  auditLogsCriticalBreakdownPrefeitura,
  auditLogsCriticalBreakdownUbt,
  auditLogsHourlyActivityAdmin,
  auditLogsHourlyActivityPrefeitura,
  auditLogsHourlyActivityUbt,
  auditLogsSummaryAdmin,
  auditLogsSummaryPrefeitura,
  auditLogsSummaryUbt,
  getAuditLogsEntriesForScope,
  type AuditLogEntry,
} from '../../data/auditLogsMock'
import type { AuditLogScope, AuditLogTenantColumnMode } from '../../types/auditLogScope'
import { buildAuditLogsFilterOptions } from './buildAuditLogsFilterOptions'

const PAGE_SIZE = 10

function entriesForScope(scope: AuditLogScope): AuditLogEntry[] {
  return getAuditLogsEntriesForScope(scope)
}

type AuditLogsSummary = {
  totalEvents: number
  totalEventsTrend: string
  activeUsers: number
  activeUsersTrend: string
  criticalEvents: number
  criticalEventsTrend: string
  successRate: string
  successRateTrend: string
  peakHourLabel: string
  peakHourCount: number
}

type AuditLogsHourlyPoint = { label: string; count: number }

type AuditLogsByTypeSlice = {
  key: string
  label: string
  count: number
  percent: number
  gradientFrom: string
  gradientTo: string
}

type AuditLogsCriticalSlice = {
  key: string
  label: string
  count: number
  trend: string
}

type AuditLogsFilterOptions = {
  users: readonly { value: string; label: string }[]
  actions: readonly { value: string; label: string }[]
  modules: readonly { value: string; label: string }[]
  periods: readonly { value: string; label: string }[]
  prefeituras?: readonly { value: string; label: string }[]
  ubts?: readonly { value: string; label: string }[]
  ubtsByPrefeitura?: Readonly<Record<string, readonly { value: string; label: string }[]>>
  platforms?: readonly { value: string; label: string }[]
  userTypes?: readonly { value: string; label: string }[]
  units?: readonly { value: string; label: string }[]
  serverResponses?: readonly { value: string; label: string }[]
  outcomes?: readonly { value: string; label: string }[]
}

export type { AuditLogsFilterOptions }

export type AuditLogsDataset = {
  pageOne: AuditLogEntry[]
  pagination: { total: number; pageSize: number; totalPages: number }
  summary: AuditLogsSummary
  hourlyActivity: readonly AuditLogsHourlyPoint[]
  byType: readonly AuditLogsByTypeSlice[]
  criticalBreakdown: readonly AuditLogsCriticalSlice[]
  filterOptions: AuditLogsFilterOptions
  exportUnitLabel: string
  showPlatformColumn: boolean
  tenantColumnMode: AuditLogTenantColumnMode
}

export function getAuditLogsDataset(scope: AuditLogScope): AuditLogsDataset {
  const scopedEntries = entriesForScope(scope)

  const paginationTotal =
    scope === 'admin'
      ? AUDIT_LOGS_PAGINATION_TOTAL_ADMIN
      : scope === 'prefeitura'
        ? AUDIT_LOGS_PAGINATION_TOTAL_PREFEITURA
        : AUDIT_LOGS_PAGINATION_TOTAL_UBT

  const summary =
    scope === 'admin'
      ? auditLogsSummaryAdmin
      : scope === 'prefeitura'
        ? auditLogsSummaryPrefeitura
        : auditLogsSummaryUbt

  const hourlyActivity =
    scope === 'admin'
      ? auditLogsHourlyActivityAdmin
      : scope === 'prefeitura'
        ? auditLogsHourlyActivityPrefeitura
        : auditLogsHourlyActivityUbt

  const byType =
    scope === 'admin'
      ? auditLogsByTypeAdmin
      : scope === 'prefeitura'
        ? auditLogsByTypePrefeitura
        : auditLogsByTypeUbt

  const criticalBreakdown =
    scope === 'admin'
      ? auditLogsCriticalBreakdownAdmin
      : scope === 'prefeitura'
        ? auditLogsCriticalBreakdownPrefeitura
        : auditLogsCriticalBreakdownUbt

  const filterOptions = buildAuditLogsFilterOptions(scope, scopedEntries)

  const exportUnitLabel =
    scope === 'admin'
      ? 'Plataforma Telefarmed (todas as unidades)'
      : scope === 'prefeitura'
        ? 'Rede municipal e UBTs vinculadas'
        : 'Unidade UBT'

  return {
    pageOne: scopedEntries.slice(0, PAGE_SIZE),
    pagination: {
      total: paginationTotal,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(paginationTotal / PAGE_SIZE)),
    },
    summary,
    hourlyActivity,
    byType,
    criticalBreakdown,
    filterOptions,
    exportUnitLabel,
    showPlatformColumn: scope === 'admin',
    tenantColumnMode:
      scope === 'admin' ? 'full' : scope === 'prefeitura' ? 'ubt' : 'none',
  }
}

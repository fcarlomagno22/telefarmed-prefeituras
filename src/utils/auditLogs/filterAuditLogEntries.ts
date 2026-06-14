import type { AuditLogEntry } from '../../types/auditLogs'
import type { AuditCriticalityLevel, AuditLogsAdvancedFilters } from '../auditLogsAdvancedFilters'
import type { AuditLogsFilterOptions } from './getAuditLogsDataset'
import {
  isAuditUbtAllowedForPrefeitura,
  resolveAuditPrefeituraFilter,
  resolveAuditUbtFilter,
} from './auditLogTenantFilters'

function slugifyFilterValue(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

function entryTimestamp(entry: AuditLogEntry): number {
  const iso = entry.createdAt
  if (iso) {
    const parsed = new Date(iso).getTime()
    if (!Number.isNaN(parsed)) return parsed
  }
  const brMatch = entry.dateTime.match(
    /(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/,
  )
  if (brMatch) {
    const [, day, month, year, hour = '0', minute = '0'] = brMatch
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    ).getTime()
  }
  return 0
}

function matchesSlugLabel(entryLabel: string | null | undefined, filterValue: string): boolean {
  if (!filterValue) return true
  if (!entryLabel?.trim()) return false
  return slugifyFilterValue(entryLabel) === filterValue
}

function matchesPeriod(entry: AuditLogEntry, period: string, now = Date.now()): boolean {
  if (!period) return true
  const ts = entryTimestamp(entry)
  if (!ts) return true

  const hoursByPeriod: Record<string, number> = {
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30,
  }
  const hours = hoursByPeriod[period]
  if (!hours) return true
  return now - ts <= hours * 60 * 60 * 1000
}

function matchesPrefeituraFilter(
  entry: AuditLogEntry,
  prefeituraKey: string,
  prefeituras?: AuditLogsFilterOptions['prefeituras'],
) {
  if (!prefeituraKey) return true
  const label = resolveAuditPrefeituraFilter(prefeituraKey, prefeituras)
  if (!label) return true
  return entry.prefeituraName === label
}

function matchesUbtFilter(
  entry: AuditLogEntry,
  prefeituraKey: string,
  ubtKey: string,
  filterOptions: Pick<AuditLogsFilterOptions, 'ubts' | 'ubtsByPrefeitura'>,
) {
  if (!ubtKey) return true
  if (!prefeituraKey) return true
  if (!isAuditUbtAllowedForPrefeitura(prefeituraKey, ubtKey, filterOptions)) {
    return false
  }
  const label = resolveAuditUbtFilter(ubtKey, filterOptions.ubts)
  if (!label) return true
  return entry.ubtName === label
}

export function severityMatchesCriticality(
  severity: AuditLogEntry['severity'],
  level: AuditCriticalityLevel,
): boolean {
  if (level === 'all') return true
  if (level === 'critical') return severity === 'critical'
  if (level === 'high') return severity === 'warning'
  return severity === 'info'
}

export type AuditLogsToolbarFilters = {
  user?: string
  action?: string
  module?: string
  period?: string
}

export function filterAuditLogEntries(
  entries: AuditLogEntry[],
  filters: Pick<
    AuditLogsAdvancedFilters,
    | 'criticality'
    | 'platform'
    | 'prefeitura'
    | 'ubt'
    | 'userId'
    | 'userType'
    | 'action'
    | 'module'
    | 'outcome'
    | 'serverResponse'
    | 'startDate'
    | 'endDate'
    | 'timeFrom'
    | 'timeTo'
    | 'resourceId'
    | 'ipDevice'
  >,
  filterOptions: Pick<AuditLogsFilterOptions, 'prefeituras' | 'ubts' | 'ubtsByPrefeitura'>,
  search = '',
  toolbar: AuditLogsToolbarFilters = {},
): AuditLogEntry[] {
  const query = search.trim().toLowerCase()
  const userFilter = toolbar.user || filters.userId
  const actionFilter = toolbar.action || filters.action
  const moduleFilter = toolbar.module || filters.module

  return entries.filter((entry) => {
    if (!severityMatchesCriticality(entry.severity, filters.criticality)) return false
    if (filters.platform && entry.platform !== filters.platform) return false
    if (!matchesPrefeituraFilter(entry, filters.prefeitura, filterOptions.prefeituras)) {
      return false
    }
    if (!matchesUbtFilter(entry, filters.prefeitura, filters.ubt, filterOptions)) {
      return false
    }
    if (!matchesSlugLabel(entry.userName, userFilter)) return false
    if (!matchesSlugLabel(entry.userRole, filters.userType)) return false
    if (!matchesSlugLabel(entry.actionLabel, actionFilter)) return false
    if (!matchesSlugLabel(entry.moduleName, moduleFilter)) return false
    if (filters.outcome && entry.serverResponseTone !== filters.outcome) return false
    if (
      filters.serverResponse &&
      !matchesSlugLabel(entry.serverResponse, filters.serverResponse)
    ) {
      return false
    }
    if (!matchesPeriod(entry, toolbar.period ?? '')) return false

    if (filters.resourceId.trim()) {
      const needle = filters.resourceId.trim().toLowerCase()
      if (!entry.resourceId.toLowerCase().includes(needle)) return false
    }

    if (filters.ipDevice.trim()) {
      const needle = filters.ipDevice.trim().toLowerCase()
      const haystack = `${entry.ipAddress} ${entry.deviceInfo}`.toLowerCase()
      if (!haystack.includes(needle)) return false
    }

    if (filters.startDate || filters.endDate) {
      const ts = entryTimestamp(entry)
      if (ts) {
        if (filters.startDate) {
          const start = new Date(`${filters.startDate}T${filters.timeFrom || '00:00'}:00`)
          if (ts < start.getTime()) return false
        }
        if (filters.endDate) {
          const end = new Date(`${filters.endDate}T${filters.timeTo || '23:59'}:59`)
          if (ts > end.getTime()) return false
        }
      }
    }

    if (!query) return true

    const haystack = [
      entry.prefeituraName,
      entry.ubtName,
      entry.userName,
      entry.userRole,
      entry.actionLabel,
      entry.moduleName,
      entry.pagePath,
      entry.resourceLabel,
      entry.resourceId,
      entry.ipAddress,
      entry.deviceInfo,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
}

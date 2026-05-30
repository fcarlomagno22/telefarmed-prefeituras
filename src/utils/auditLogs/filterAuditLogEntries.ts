import type { AuditLogEntry } from '../../data/auditLogsMock'
import type { AuditCriticalityLevel, AuditLogsAdvancedFilters } from '../auditLogsAdvancedFilters'
import {
  isAuditUbtAllowedForPrefeitura,
  resolveAuditPrefeituraFilter,
  resolveAuditUbtFilter,
} from './auditLogTenantFilters'

function matchesPrefeituraFilter(entry: AuditLogEntry, prefeituraKey: string) {
  if (!prefeituraKey) return true
  const label = resolveAuditPrefeituraFilter(prefeituraKey)
  if (!label) return true
  return entry.prefeituraName === label
}

function matchesUbtFilter(
  entry: AuditLogEntry,
  prefeituraKey: string,
  ubtKey: string,
) {
  if (!ubtKey) return true
  if (!prefeituraKey) return true
  if (!isAuditUbtAllowedForPrefeitura(prefeituraKey, ubtKey)) {
    return false
  }
  const label = resolveAuditUbtFilter(ubtKey)
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

export function filterAuditLogEntries(
  entries: AuditLogEntry[],
  filters: Pick<
    AuditLogsAdvancedFilters,
    'criticality' | 'platform' | 'prefeitura' | 'ubt'
  >,
  search = '',
): AuditLogEntry[] {
  const query = search.trim().toLowerCase()

  return entries.filter((entry) => {
    if (!severityMatchesCriticality(entry.severity, filters.criticality)) return false
    if (filters.platform && entry.platform !== filters.platform) return false
    if (!matchesPrefeituraFilter(entry, filters.prefeitura)) return false
    if (!matchesUbtFilter(entry, filters.prefeitura, filters.ubt)) return false
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
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
}

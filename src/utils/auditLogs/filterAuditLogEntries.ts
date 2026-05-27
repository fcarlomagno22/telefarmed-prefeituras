import type { AuditLogEntry } from '../../data/auditLogsMock'
import type { AuditCriticalityLevel, AuditLogsAdvancedFilters } from '../auditLogsAdvancedFilters'

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
  filters: Pick<AuditLogsAdvancedFilters, 'criticality'>,
  search = '',
): AuditLogEntry[] {
  const query = search.trim().toLowerCase()

  return entries.filter((entry) => {
    if (!severityMatchesCriticality(entry.severity, filters.criticality)) return false
    if (!query) return true

    const haystack = [
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

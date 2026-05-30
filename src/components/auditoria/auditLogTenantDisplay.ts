import type { AuditLogEntry } from '../../data/auditLogsMock'
import type { AuditLogTenantColumnMode } from '../../types/auditLogScope'

export type { AuditLogTenantColumnMode }

export function formatAuditPrefeituraLabel(name: string | null) {
  if (!name) return '—'
  return name
}

export function formatAuditUbtLabel(name: string | null) {
  if (!name) return '—'
  return name
}

export function auditEntryHasTenantInfo(entry: AuditLogEntry, mode: AuditLogTenantColumnMode) {
  if (mode === 'none') return false
  if (mode === 'ubt') return Boolean(entry.ubtName)
  return Boolean(entry.prefeituraName || entry.ubtName)
}

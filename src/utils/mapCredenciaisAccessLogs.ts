import type { AccessLogEntry } from '../data/accessLogsMock'
import type { AuditLogEntry } from '../types/auditLogs'

export type CredenciaisAccessLogUser = {
  id: string
  name: string
  email: string
  initials: string
  avatarClassName: string
  avatarUrl?: string
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase()
}

export function mapAuditLogEntryToAccessLogEntry(
  entry: AuditLogEntry,
  usersById: Map<string, CredenciaisAccessLogUser>,
): AccessLogEntry {
  const matchedUser = usersById.get(entry.resourceId)
  const accessedAt = entry.createdAt ?? new Date().toISOString()
  const outcome = entry.serverResponseTone === 'error' ? 'failure' : 'success'

  return {
    id: entry.id,
    userId: entry.resourceId,
    userName: matchedUser?.name ?? entry.userName,
    userEmail: matchedUser?.email ?? '',
    initials: matchedUser?.initials ?? initialsFromName(entry.userName),
    avatarClassName: matchedUser?.avatarClassName ?? 'bg-gray-200 text-gray-600',
    avatarUrl: matchedUser?.avatarUrl,
    accessedAt,
    pageId: 'auth',
    pageLabel: entry.actionLabel || entry.moduleName || 'Autenticação',
    device: entry.deviceInfo || '—',
    ipAddress: entry.ipAddress || '—',
    outcome,
  }
}

export function mapAuditLogEntriesToAccessLogs(
  entries: AuditLogEntry[],
  users: CredenciaisAccessLogUser[],
): AccessLogEntry[] {
  const usersById = new Map(users.map((user) => [user.id, user]))
  return entries.map((entry) => mapAuditLogEntryToAccessLogEntry(entry, usersById))
}

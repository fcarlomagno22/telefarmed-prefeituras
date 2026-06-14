import type { AuditLogEntry } from '../../types/auditLogs'

export type AuditLogsHourlyPoint = { label: string; count: number }

export type AuditLogsCriticalSlice = {
  key: string
  label: string
  count: number
  trend: string
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

function isWithinLastHours(entry: AuditLogEntry, hours: number, now = Date.now()): boolean {
  const ts = entryTimestamp(entry)
  if (!ts) return false
  return now - ts <= hours * 60 * 60 * 1000
}

export function buildHourlyActivityFromEntries(
  entries: AuditLogEntry[],
  now = new Date(),
): AuditLogsHourlyPoint[] {
  const buckets = Array.from({ length: 12 }, (_, index) => ({
    label: `${index * 2}h`,
    count: 0,
  }))

  const since = now.getTime() - 24 * 60 * 60 * 1000

  for (const entry of entries) {
    const ts = entryTimestamp(entry)
    if (!ts || ts < since) continue
    const date = new Date(ts)
    const hour = date.getHours()
    const bucketIndex = Math.min(11, Math.floor(hour / 2))
    buckets[bucketIndex]!.count += 1
  }

  return buckets
}

export function buildSuccessRateFromEntries(entries: AuditLogEntry[]): {
  successRate: string
  successRateTrend: string
} {
  const last24h = entries.filter((entry) => isWithinLastHours(entry, 24))
  if (last24h.length === 0) {
    return { successRate: '—', successRateTrend: '—' }
  }

  const successCount = last24h.filter((entry) => entry.serverResponseTone === 'success').length
  const percent = Math.round((successCount / last24h.length) * 1000) / 10
  return {
    successRate: `${percent}%`,
    successRateTrend: '—',
  }
}

export function buildPeakHourFromActivity(
  hourlyActivity: AuditLogsHourlyPoint[],
): { peakHourLabel: string; peakHourCount: number } {
  if (hourlyActivity.length === 0) {
    return { peakHourLabel: '—', peakHourCount: 0 }
  }

  const peak = hourlyActivity.reduce((best, point) =>
    point.count > best.count ? point : best,
  )

  return {
    peakHourLabel: peak.label,
    peakHourCount: peak.count,
  }
}

export function buildCriticalBreakdownFromEntries(
  entries: AuditLogEntry[],
): AuditLogsCriticalSlice[] {
  const last24h = entries.filter((entry) => isWithinLastHours(entry, 24))

  const slices: AuditLogsCriticalSlice[] = [
    {
      key: 'deletions',
      label: 'Exclusões realizadas',
      count: last24h.filter((entry) => entry.actionTone === 'delete').length,
      trend: '—',
    },
    {
      key: 'permissions',
      label: 'Falhas de permissão',
      count: last24h.filter(
        (entry) =>
          entry.serverResponseTone === 'error' &&
          (entry.actionTone === 'auth' || entry.severity === 'warning'),
      ).length,
      trend: '—',
    },
    {
      key: 'system',
      label: 'Erros do sistema',
      count: last24h.filter(
        (entry) => entry.severity === 'critical' && entry.actionTone !== 'delete',
      ).length,
      trend: '—',
    },
  ]

  return slices.filter((slice) => slice.count > 0)
}

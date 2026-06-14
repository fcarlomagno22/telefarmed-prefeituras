import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuditLogEntry } from '../types/auditLogs'
import { useOptionalAdminAuth } from '../contexts/AdminAuthContext'
import { useOptionalPrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import { useOptionalUbtAuth } from '../contexts/UbtAuthContext'
import {
  fetchAdminAuditoria,
  fetchAdminAuditoriaSummary,
} from '../lib/services/admin/auditoria'
import {
  fetchPortalAuditoria,
  fetchPortalAuditoriaSummary,
} from '../lib/services/portal/auditoria'
import type { AuditLogScope } from '../types/auditLogScope'
import { isBackendApiEnabled } from '../lib/api/config'
import type { AuditLogsDataset } from '../utils/auditLogs/getAuditLogsDataset'
import { getAuditLogsDataset } from '../utils/auditLogs/getAuditLogsDataset'
import { buildAuditLogsFilterOptions } from '../utils/auditLogs/buildAuditLogsFilterOptions'
import {
  buildCriticalBreakdownFromEntries,
  buildHourlyActivityFromEntries,
  buildPeakHourFromActivity,
  buildSuccessRateFromEntries,
} from '../utils/auditLogs/buildAuditLogsAnalytics'

const PAGE_SIZE = 10
const FETCH_LIMIT = 100
const useApiBackend = isBackendApiEnabled()

function defaultFromIso(): string {
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return from.toISOString()
}

function buildByType(entries: AuditLogEntry[]) {
  const counts: Record<string, number> = {}
  for (const entry of entries) {
    counts[entry.actionTone] = (counts[entry.actionTone] ?? 0) + 1
  }
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0) || 1
  const labels: Record<string, string> = {
    auth: 'Auth',
    create: 'Criação',
    view: 'Visualização',
    update: 'Alteração',
    delete: 'Exclusão',
  }
  const colors: Record<string, { from: string; to: string }> = {
    auth: { from: '#6366f1', to: '#818cf8' },
    create: { from: '#22c55e', to: '#4ade80' },
    view: { from: '#0ea5e9', to: '#38bdf8' },
    update: { from: '#f59e0b', to: '#fbbf24' },
    delete: { from: '#ef4444', to: '#f87171' },
  }

  return Object.entries(counts).map(([key, count]) => ({
    key,
    label: labels[key] ?? key,
    count,
    percent: Math.round((count / total) * 1000) / 10,
    gradientFrom: colors[key]?.from ?? '#94a3b8',
    gradientTo: colors[key]?.to ?? '#cbd5e1',
  }))
}

function emptyDataset(scope: AuditLogScope): AuditLogsDataset {
  return {
    pageOne: [],
    pagination: { total: 0, pageSize: PAGE_SIZE, totalPages: 1 },
    summary: {
      totalEvents: 0,
      totalEventsTrend: '—',
      activeUsers: 0,
      activeUsersTrend: '—',
      criticalEvents: 0,
      criticalEventsTrend: '—',
      successRate: '—',
      successRateTrend: '—',
      peakHourLabel: '—',
      peakHourCount: 0,
    },
    hourlyActivity: Array.from({ length: 12 }, (_, i) => ({
      label: `${i * 2}h`,
      count: 0,
    })),
    byType: [],
    criticalBreakdown: [],
    filterOptions: buildAuditLogsFilterOptions(scope, []),
    exportUnitLabel:
      scope === 'admin'
        ? 'Plataforma Telefarmed (todas as unidades)'
        : scope === 'prefeitura'
          ? 'Rede municipal e UBTs vinculadas'
          : 'Unidade UBT',
    showPlatformColumn: scope === 'admin',
    tenantColumnMode: scope === 'admin' ? 'full' : scope === 'prefeitura' ? 'ubt' : 'none',
  }
}

async function loadAuditoria(
  scope: AuditLogScope,
  token: string,
): Promise<{ entries: AuditLogEntry[]; total: number; summary: Awaited<ReturnType<typeof fetchAdminAuditoriaSummary>> }> {
  const query = { limit: FETCH_LIMIT, from: defaultFromIso() }

  if (scope === 'admin') {
    const [list, summary] = await Promise.all([
      fetchAdminAuditoria(token, query),
      fetchAdminAuditoriaSummary(token),
    ])
    return { entries: list.entries, total: list.total, summary }
  }
  if (scope === 'prefeitura') {
    const [list, summary] = await Promise.all([
      fetchPortalAuditoria('prefeitura', token, query),
      fetchPortalAuditoriaSummary('prefeitura', token),
    ])
    return { entries: list.entries, total: list.total, summary }
  }
  const [list, summary] = await Promise.all([
    fetchPortalAuditoria('ubt', token, query),
    fetchPortalAuditoriaSummary('ubt', token),
  ])
  return { entries: list.entries, total: list.total, summary }
}

export function useAuditLogsPage(scope: AuditLogScope) {
  const adminAuth = useOptionalAdminAuth()
  const prefeituraAuth = useOptionalPrefeituraAuth()
  const ubtAuth = useOptionalUbtAuth()

  const getToken = useCallback(() => {
    if (scope === 'admin') return adminAuth?.getAccessToken() ?? null
    if (scope === 'prefeitura') return prefeituraAuth?.getAccessToken() ?? null
    return ubtAuth?.getAccessToken() ?? null
  }, [scope, adminAuth, prefeituraAuth, ubtAuth])

  const isBootstrapping =
    scope === 'admin'
      ? (adminAuth?.isBootstrapping ?? true)
      : scope === 'prefeitura'
        ? (prefeituraAuth?.isBootstrapping ?? true)
        : (ubtAuth?.isBootstrapping ?? true)

  const isAuthenticated =
    scope === 'admin'
      ? (adminAuth?.isAuthenticated ?? false)
      : scope === 'prefeitura'
        ? (prefeituraAuth?.isAuthenticated ?? false)
        : (ubtAuth?.isAuthenticated ?? false)

  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [summaryApi, setSummaryApi] = useState<{
    totalEvents: number
    criticalEvents: number
    activeUsers: number
    totalAcessos: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await loadAuditoria(scope, token)
      setEntries(result.entries)
      setTotal(result.total)
      setSummaryApi(result.summary)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar auditoria.')
    } finally {
      setIsLoading(false)
    }
  }, [getToken, scope])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isBootstrapping, isAuthenticated, reload])

  const dataset = useMemo((): AuditLogsDataset => {
    const base = emptyDataset(scope)
    const staticDemo =
      !useApiBackend && (scope === 'prefeitura' || scope === 'ubt')
        ? getAuditLogsDataset(scope)
        : null
    const byType = buildByType(entries)
    const filterOptions = buildAuditLogsFilterOptions(scope, entries.length > 0 ? entries : staticDemo?.pageOne ?? [])
    const hourlyActivity = buildHourlyActivityFromEntries(entries)
    const { successRate, successRateTrend } = buildSuccessRateFromEntries(entries)
    const { peakHourLabel, peakHourCount } = buildPeakHourFromActivity(hourlyActivity)
    const criticalBreakdown = buildCriticalBreakdownFromEntries(entries)

    if (staticDemo) {
      return {
        ...base,
        pageOne: entries,
        filterOptions,
        pagination: staticDemo.pagination,
        summary: {
          ...staticDemo.summary,
          activeUsers: summaryApi?.activeUsers ?? staticDemo.summary.activeUsers,
          criticalEvents: summaryApi?.criticalEvents ?? staticDemo.summary.criticalEvents,
          totalEvents: summaryApi
            ? summaryApi.totalEvents + summaryApi.totalAcessos
            : staticDemo.summary.totalEvents,
        },
        hourlyActivity: staticDemo.hourlyActivity,
        byType: staticDemo.byType,
        criticalBreakdown: staticDemo.criticalBreakdown,
        exportUnitLabel: staticDemo.exportUnitLabel,
        showPlatformColumn: staticDemo.showPlatformColumn,
        tenantColumnMode: staticDemo.tenantColumnMode,
      }
    }

    return {
      ...base,
      pageOne: entries,
      filterOptions,
      pagination: {
        total,
        pageSize: PAGE_SIZE,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
      summary: {
        totalEvents: summaryApi
          ? summaryApi.totalEvents + summaryApi.totalAcessos
          : total,
        totalEventsTrend: '—',
        activeUsers: summaryApi?.activeUsers ?? 0,
        activeUsersTrend: '—',
        criticalEvents: summaryApi?.criticalEvents ?? criticalBreakdown.reduce((sum, item) => sum + item.count, 0),
        criticalEventsTrend: '—',
        successRate,
        successRateTrend,
        peakHourLabel,
        peakHourCount,
      },
      hourlyActivity,
      byType,
      criticalBreakdown,
    }
  }, [entries, scope, summaryApi, total])

  return { dataset, isLoading: isLoading || isBootstrapping, error, reload }
}

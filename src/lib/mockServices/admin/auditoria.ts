import type { ListAuditoriaParams, AuditoriaSummary } from '../../../types/auditLogs'
import { auditLogsAllEntries, auditLogsSummaryAdmin } from '../../../data/auditLogsMock'
import { mockDelay } from '../delay'

export type FetchAuditoriaResult = {
  entries: import('../../../types/auditLogs').AuditLogEntry[]
  total: number
  totalAcessos: number
  totalEventos: number
}

function applyFilters(params: ListAuditoriaParams) {
  const search = params.search?.trim().toLowerCase()
  return auditLogsAllEntries.filter((entry) => {
    if (params.portal && entry.platform !== params.portal) return false
    if (params.acao && !entry.actionLabel.toLowerCase().includes(params.acao.toLowerCase())) return false
    if (params.pagina && !entry.pagePath.toLowerCase().includes(params.pagina.toLowerCase())) return false
    if (search) {
      const haystack = [
        entry.userName,
        entry.userRole,
        entry.actionLabel,
        entry.moduleName,
        entry.pagePath,
        entry.resourceLabel,
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

export async function fetchAdminAuditoria(
  _token: string,
  params: ListAuditoriaParams = {},
): Promise<FetchAuditoriaResult> {
  const filtered = applyFilters(params)
  const offset = params.offset ?? 0
  const limit = params.limit ?? filtered.length
  const entries = filtered.slice(offset, offset + limit)
  const totalAcessos = filtered.filter((entry) => entry.actionTone === 'auth').length
  const totalEventos = filtered.length - totalAcessos
  return mockDelay(
    {
      entries,
      total: filtered.length,
      totalAcessos,
      totalEventos,
    },
    60,
  )
}

export async function fetchAdminAuditoriaSummary(_token: string): Promise<AuditoriaSummary> {
  void _token
  return mockDelay(
    {
      totalEvents: auditLogsSummaryAdmin.totalEvents,
      criticalEvents: auditLogsSummaryAdmin.criticalEvents,
      activeUsers: auditLogsSummaryAdmin.activeUsers,
      totalAcessos: Math.round(auditLogsSummaryAdmin.totalEvents * 0.24),
    },
    50,
  )
}

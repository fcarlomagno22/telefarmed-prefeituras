import { auditLogsAllEntries, auditLogsSummaryUbt } from '../../../data/auditLogsMock'
import type { ListAuditoriaParams } from '../../../types/auditLogs'
import { mockDelay } from '../delay'

export class UbtAuditoriaApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'UbtAuditoriaApiError'
    this.status = status
    this.code = code
  }
}

export function isUbtAuditoriaApiError(error: unknown): error is UbtAuditoriaApiError {
  return error instanceof UbtAuditoriaApiError
}

function applyFilters(params: ListAuditoriaParams = {}) {
  let entries = auditLogsAllEntries.filter((entry) => entry.platform === 'ubt' || entry.platform === 'atendimento')

  if (params.search?.trim()) {
    const needle = params.search.trim().toLowerCase()
    entries = entries.filter((entry) =>
      [
        entry.userName,
        entry.actionLabel,
        entry.moduleName,
        entry.pagePath,
        entry.resourceLabel,
        entry.resourceId,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }
  if (params.portal) {
    entries = entries.filter((entry) => entry.platform === params.portal)
  }
  if (params.acao) {
    entries = entries.filter((entry) => entry.actionTone === params.acao)
  }
  if (params.unidadeUbtId) {
    entries = entries.filter((entry) =>
      (entry.ubtName ?? '').toLowerCase().includes(params.unidadeUbtId?.toLowerCase() ?? ''),
    )
  }

  const total = entries.length
  const limit = params.limit && params.limit > 0 ? params.limit : total
  const offset = params.offset && params.offset >= 0 ? params.offset : 0
  return {
    entries: entries.slice(offset, offset + limit),
    total,
    totalAcessos: entries.filter((entry) => entry.kind === 'acesso' || entry.actionTone === 'auth').length,
    totalEventos: entries.filter((entry) => entry.kind !== 'acesso' && entry.actionTone !== 'auth').length,
  }
}

export async function fetchUbtAuditoria(
  _token: string,
  params: ListAuditoriaParams = {},
) {
  return mockDelay(applyFilters(params))
}

export async function fetchUbtAuditoriaSummary(_token: string) {
  void _token
  return mockDelay({
    totalEvents: auditLogsSummaryUbt.totalEvents,
    criticalEvents: auditLogsSummaryUbt.criticalEvents,
    activeUsers: auditLogsSummaryUbt.activeUsers,
    totalAcessos: auditLogsSummaryUbt.totalEvents - auditLogsSummaryUbt.criticalEvents,
  })
}

import {
  AUDIT_LOGS_PAGINATION_TOTAL_PREFEITURA,
  auditLogsSummaryPrefeitura,
  getAuditLogsEntriesForScope,
} from '../../../data/auditLogsMock'
import type { ListAuditoriaParams } from '../../../types/auditLogs'
import { mockDelay } from '../delay'

export type FetchAuditoriaResult = {
  entries: import('../../../types/auditLogs').AuditLogEntry[]
  total: number
  totalAcessos: number
  totalEventos: number
}

export class PrefeituraAuditoriaApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PrefeituraAuditoriaApiError'
    this.status = status
    this.code = code
  }
}

export function isPrefeituraAuditoriaApiError(error: unknown): error is PrefeituraAuditoriaApiError {
  return error instanceof PrefeituraAuditoriaApiError
}

function applyFilters(params: ListAuditoriaParams = {}) {
  let entries = getAuditLogsEntriesForScope('prefeitura')

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
        entry.ubtName ?? '',
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
    entries = entries.filter(
      (entry) =>
        entry.actionTone === params.acao ||
        entry.actionLabel.toLowerCase().includes(params.acao!.toLowerCase()),
    )
  }
  if (params.pagina) {
    entries = entries.filter((entry) =>
      entry.pagePath.toLowerCase().includes(params.pagina!.toLowerCase()),
    )
  }
  if (params.unidadeUbtId) {
    entries = entries.filter((entry) =>
      (entry.ubtName ?? '').toLowerCase().includes(params.unidadeUbtId?.toLowerCase() ?? ''),
    )
  }

  const limit = params.limit && params.limit > 0 ? params.limit : entries.length
  const offset = params.offset && params.offset >= 0 ? params.offset : 0
  return {
    entries: entries.slice(offset, offset + limit),
    total: AUDIT_LOGS_PAGINATION_TOTAL_PREFEITURA,
    totalAcessos: entries.filter((entry) => entry.kind === 'acesso' || entry.actionTone === 'auth').length,
    totalEventos: entries.filter((entry) => entry.kind !== 'acesso' && entry.actionTone !== 'auth').length,
  }
}

export async function fetchPrefeituraAuditoria(
  _token: string,
  params: ListAuditoriaParams = {},
): Promise<FetchAuditoriaResult> {
  void _token
  return mockDelay(applyFilters(params), 60)
}

export async function fetchPrefeituraAuditoriaSummary(_token: string) {
  void _token
  return mockDelay(
    {
      totalEvents: auditLogsSummaryPrefeitura.totalEvents,
      criticalEvents: auditLogsSummaryPrefeitura.criticalEvents,
      activeUsers: auditLogsSummaryPrefeitura.activeUsers,
      totalAcessos: Math.round(auditLogsSummaryPrefeitura.totalEvents * 0.22),
    },
    50,
  )
}

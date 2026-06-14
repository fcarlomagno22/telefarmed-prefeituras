import type { AuditoriaSummary, AuditLogEntry, ListAuditoriaParams } from '../../../types/auditLogs'
import { ApiError, apiFetch } from '../http'

export type FetchAuditoriaResult = {
  entries: AuditLogEntry[]
  total: number
  totalAcessos: number
  totalEventos: number
}

export class AdminAuditoriaApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'AdminAuditoriaApiError'
  }
}

function mapApiError(error: unknown): AdminAuditoriaApiError {
  if (error instanceof ApiError) {
    return new AdminAuditoriaApiError(error.message, error.status, error.code)
  }
  return new AdminAuditoriaApiError('Não foi possível completar a requisição.', 0)
}

export function isAdminAuditoriaApiError(error: unknown): error is AdminAuditoriaApiError {
  return error instanceof AdminAuditoriaApiError
}

function buildQuery(params: ListAuditoriaParams = {}) {
  const query = new URLSearchParams()
  if (params.limit != null) query.set('limit', String(params.limit))
  if (params.offset != null) query.set('offset', String(params.offset))
  if (params.search) query.set('search', params.search)
  if (params.portal) query.set('portal', params.portal)
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  if (params.atorId) query.set('atorId', params.atorId)
  if (params.acao) query.set('acao', params.acao)
  if (params.pagina) query.set('pagina', params.pagina)
  if (params.recursoTipo) query.set('recursoTipo', params.recursoTipo)
  if (params.recursoId) query.set('recursoId', params.recursoId)
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

export async function fetchAdminAuditoria(accessToken: string, params: ListAuditoriaParams = {}) {
  try {
    return await apiFetch<FetchAuditoriaResult>(`/admin/auditoria${buildQuery(params)}`, {
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchAdminAuditoriaSummary(
  accessToken: string,
  params: Pick<ListAuditoriaParams, 'from' | 'to' | 'portal'> = {},
) {
  try {
    return await apiFetch<AuditoriaSummary>(`/admin/auditoria/summary${buildQuery(params)}`, {
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function sendAdminAuditoriaClientEvent(
  accessToken: string,
  input: {
    pagePath: string
    actionLabel: string
    moduleName?: string
    resourceLabel?: string
    resourceId?: string
    payload?: Record<string, unknown>
  },
) {
  try {
    await apiFetch<void>('/admin/auditoria/eventos', {
      accessToken,
      method: 'POST',
      json: input,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

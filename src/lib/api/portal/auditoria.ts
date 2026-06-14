import type { AuditoriaSummary, ListAuditoriaParams } from '../../../types/auditLogs'
import { ApiError, apiFetch } from '../http'

export type PortalAuditoriaVariant = 'prefeitura' | 'ubt' | 'profissional'

export type FetchAuditoriaResult = {
  entries: import('../../../types/auditLogs').AuditLogEntry[]
  total: number
  totalAcessos: number
  totalEventos: number
}

export class PortalAuditoriaApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PortalAuditoriaApiError'
  }
}

function mapApiError(error: unknown): PortalAuditoriaApiError {
  if (error instanceof ApiError) {
    return new PortalAuditoriaApiError(error.message, error.status, error.code)
  }
  return new PortalAuditoriaApiError('Não foi possível completar a requisição.', 0)
}

export function isPortalAuditoriaApiError(error: unknown): error is PortalAuditoriaApiError {
  return error instanceof PortalAuditoriaApiError
}

function prefix(variant: PortalAuditoriaVariant) {
  return `/${variant}/auditoria`
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

export async function fetchPortalAuditoria(
  variant: 'prefeitura' | 'ubt',
  accessToken: string,
  params: ListAuditoriaParams = {},
) {
  try {
    return await apiFetch<FetchAuditoriaResult>(`${prefix(variant)}${buildQuery(params)}`, {
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchPortalAuditoriaSummary(
  variant: 'prefeitura' | 'ubt',
  accessToken: string,
  params: Pick<ListAuditoriaParams, 'from' | 'to' | 'portal'> = {},
) {
  try {
    return await apiFetch<AuditoriaSummary>(`${prefix(variant)}/summary${buildQuery(params)}`, {
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function sendPortalAuditoriaClientEvent(
  variant: PortalAuditoriaVariant,
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
    await apiFetch<void>(`${prefix(variant)}/eventos`, {
      accessToken,
      method: 'POST',
      json: input,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

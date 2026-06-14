import type { AdminMonitorView } from '../../../types/adminMonitor'
import { ApiError, apiFetch } from '../http'

export type AdminMonitorOverviewApi = AdminMonitorView & {
  kpis: Array<{ key: string; label: string; value: string; suffix: string; topBar: string }>
}

export type AdminMonitorQueryParams = {
  entidadeId?: string
  regionKey?: string
  timelinePeriod?: string
}

export class AdminMonitorApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'AdminMonitorApiError'
  }
}

function mapError(error: unknown): AdminMonitorApiError {
  if (error instanceof ApiError) {
    return new AdminMonitorApiError(error.message, error.status, error.code)
  }
  return new AdminMonitorApiError('Não foi possível completar a requisição.', 0)
}

export function isAdminMonitorApiError(error: unknown): error is AdminMonitorApiError {
  return error instanceof AdminMonitorApiError
}

export async function fetchAdminMonitorOverview(
  accessToken: string,
  params: AdminMonitorQueryParams = {},
) {
  try {
    const query = new URLSearchParams()
    if (params.entidadeId) query.set('entidadeId', params.entidadeId)
    if (params.regionKey) query.set('regionKey', params.regionKey)
    if (params.timelinePeriod) query.set('timelinePeriod', params.timelinePeriod)
    const suffix = query.toString()
    return await apiFetch<AdminMonitorOverviewApi>(
      `/admin/monitor/overview${suffix ? `?${suffix}` : ''}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

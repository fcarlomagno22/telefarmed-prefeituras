import type { AdminMunicipalityRow, AdminNocIncident } from '../../../types/adminDashboard'
import type {
  AdminDashboardView,
  AdminPlatformPackageView,
  AdminRevenueView,
  AdminTerminalsView,
} from '../../../utils/adminDashboardFilters'
import { ApiError, apiFetch } from '../http'

export type AdminDashboardOverviewApi = {
  filterKey: string
  municipalities: AdminMunicipalityRow[]
  nocIncidents: AdminNocIncident[]
  nocHighlight: AdminNocIncident[]
  openNocCount: number
  criticalNocCount: number
  kpis: Array<{ key: string; label: string; value: string; suffix: string; topBar: string }>
  hourly: Array<{ hour: string; value: number }>
  packageUsage: AdminPlatformPackageView
  revenue: AdminRevenueView
  terminals: AdminTerminalsView
  avgSlaMinutes: number
  isEmpty: boolean
  filterOptions: NonNullable<AdminDashboardView['filterOptions']>
}

export type AdminDashboardFiltersParams = {
  period?: string
  state?: string
  city?: string
  contract?: string
  health?: string
}

export type AdminDashboardNocPatchParams = {
  team?: string
  assignee?: string | null
  status?: AdminNocIncident['status']
}

export class AdminDashboardApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'AdminDashboardApiError'
  }
}

function mapError(error: unknown): AdminDashboardApiError {
  if (error instanceof ApiError) {
    return new AdminDashboardApiError(error.message, error.status, error.code)
  }
  return new AdminDashboardApiError('Não foi possível completar a requisição.', 0)
}

export function isAdminDashboardApiError(error: unknown): error is AdminDashboardApiError {
  return error instanceof AdminDashboardApiError
}

export async function fetchAdminDashboardOverview(
  accessToken: string,
  params: AdminDashboardFiltersParams = {},
) {
  try {
    const query = new URLSearchParams()
    if (params.period) query.set('period', params.period)
    if (params.state) query.set('state', params.state)
    if (params.city) query.set('city', params.city)
    if (params.contract) query.set('contract', params.contract)
    if (params.health) query.set('health', params.health)
    const suffix = query.toString()
    return await apiFetch<AdminDashboardOverviewApi>(
      `/admin/dashboard/overview${suffix ? `?${suffix}` : ''}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function patchAdminDashboardNocIncident(
  accessToken: string,
  incidentId: string,
  body: AdminDashboardNocPatchParams,
) {
  try {
    return await apiFetch<{ incident: AdminNocIncident }>(
      `/admin/dashboard/noc-incidents/${incidentId}`,
      {
        accessToken,
        method: 'PATCH',
        json: body,
      },
    )
  } catch (error) {
    throw mapError(error)
  }
}

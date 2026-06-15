import type {
  AdminPosConsultaDashboardFilters,
  AdminPosConsultaDashboardView,
} from '../../../types/adminPosConsultaDashboard'
import { ApiError, apiFetch } from '../http'

export class AdminPosConsultaDashboardApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'AdminPosConsultaDashboardApiError'
  }
}

function mapError(error: unknown): AdminPosConsultaDashboardApiError {
  if (error instanceof ApiError) {
    return new AdminPosConsultaDashboardApiError(error.message, error.status, error.code)
  }
  return new AdminPosConsultaDashboardApiError('Não foi possível completar a requisição.', 0)
}

export async function apiFetchAdminPosConsultaDashboard(
  accessToken: string,
  filters: AdminPosConsultaDashboardFilters,
): Promise<AdminPosConsultaDashboardView> {
  try {
    const query = new URLSearchParams({
      period: filters.period,
      state: filters.state,
      city: filters.city,
      contract: filters.contract,
    })

    return await apiFetch<AdminPosConsultaDashboardView>(
      `/admin/dashboard/pos-consulta?${query.toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export function isAdminPosConsultaDashboardApiError(
  error: unknown,
): error is AdminPosConsultaDashboardApiError {
  return error instanceof AdminPosConsultaDashboardApiError
}

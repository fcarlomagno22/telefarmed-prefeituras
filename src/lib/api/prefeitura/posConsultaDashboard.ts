import type {
  PrefeituraPosConsultaDashboardFilters,
  PrefeituraPosConsultaDashboardView,
} from '../../../types/prefeituraPosConsultaDashboard'
import { ApiError, apiFetch } from '../http'

export class PrefeituraPosConsultaDashboardApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PrefeituraPosConsultaDashboardApiError'
  }
}

function mapError(error: unknown): PrefeituraPosConsultaDashboardApiError {
  if (error instanceof ApiError) {
    return new PrefeituraPosConsultaDashboardApiError(error.message, error.status, error.code)
  }
  return new PrefeituraPosConsultaDashboardApiError('Não foi possível completar a requisição.', 0)
}

export async function apiFetchPrefeituraPosConsultaDashboard(
  accessToken: string,
  filters: PrefeituraPosConsultaDashboardFilters,
): Promise<PrefeituraPosConsultaDashboardView> {
  try {
    const query = new URLSearchParams({
      period: filters.period,
      regionKey: filters.regionKey,
    })
    if (filters.unidadeUbtId && filters.unidadeUbtId !== 'todas') {
      query.set('unidadeUbtId', filters.unidadeUbtId)
    }

    return await apiFetch<PrefeituraPosConsultaDashboardView>(
      `/prefeitura/dashboard/pos-consulta?${query.toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export function isPrefeituraPosConsultaDashboardApiError(
  error: unknown,
): error is PrefeituraPosConsultaDashboardApiError {
  return error instanceof PrefeituraPosConsultaDashboardApiError
}

import type {
  PrefeituraAlert,
  PrefeituraDashboardFilterOptions,
  PrefeituraHourlyPoint,
  PrefeituraRegionVolume,
  PrefeituraSlaRow,
  PrefeituraSpecialtyStat,
  PrefeituraUbsRow,
} from '../../../types/prefeituraDashboard'
import { ApiError, apiFetch } from '../http'

export class PrefeituraDashboardApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PrefeituraDashboardApiError'
  }
}

function mapError(error: unknown): PrefeituraDashboardApiError {
  if (error instanceof ApiError) {
    return new PrefeituraDashboardApiError(error.message, error.status, error.code)
  }
  return new PrefeituraDashboardApiError('Não foi possível completar a requisição.', 0)
}

export type PrefeituraDashboardOverviewApi = {
  kpis: Array<{ key: string; label: string; value: string; suffix: string; topBar: string }>
  ubsRows: PrefeituraUbsRow[]
  hourly: PrefeituraHourlyPoint[]
  regions: PrefeituraRegionVolume[]
  specialties: PrefeituraSpecialtyStat[]
  specialtyTotal: number
  slaRows: PrefeituraSlaRow[]
  alerts: PrefeituraAlert[]
  allAlerts: PrefeituraAlert[]
  filterOptions: PrefeituraDashboardFilterOptions
  isEmpty: boolean
}

export async function apiFetchPrefeituraDashboardOverview(
  accessToken: string,
  params: { period: string; regionKey: string; unidadeUbtId?: string },
): Promise<PrefeituraDashboardOverviewApi> {
  try {
    const query = new URLSearchParams({
      period: params.period,
      regionKey: params.regionKey,
    })
    if (params.unidadeUbtId && params.unidadeUbtId !== 'todas') {
      query.set('unidadeUbtId', params.unidadeUbtId)
    }

    return await apiFetch<PrefeituraDashboardOverviewApi>(
      `/prefeitura/dashboard/overview?${query.toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export function isPrefeituraDashboardApiError(error: unknown): error is PrefeituraDashboardApiError {
  return error instanceof PrefeituraDashboardApiError
}

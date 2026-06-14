import type {
  PrefeituraConsultasDailyPoint,
  PrefeituraConsultasKpi,
  PrefeituraConsultasSpecialtyItem,
  PrefeituraConsultasUnitRow,
} from '../../../data/prefeituraConsultasMock'
import type { PrefeituraConsultasUnitDetail } from '../../../data/prefeituraConsultasUnitDetail'
import { ApiError, apiFetch } from '../http'

export class PrefeituraConsultasApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PrefeituraConsultasApiError'
  }
}

function mapError(error: unknown): PrefeituraConsultasApiError {
  if (error instanceof ApiError) {
    return new PrefeituraConsultasApiError(error.message, error.status, error.code)
  }
  return new PrefeituraConsultasApiError('Não foi possível completar a requisição.', 0)
}

export type PrefeituraConsultasOverviewApi = {
  kpis: PrefeituraConsultasKpi[]
  units: PrefeituraConsultasUnitRow[]
  dailySeries: PrefeituraConsultasDailyPoint[]
  periodTotal: number
  specialties: PrefeituraConsultasSpecialtyItem[]
  filterOptions: {
    units: Array<{ value: string; label: string }>
    regions: Array<{ value: string; label: string }>
  }
}

export type PrefeituraConsultasUnitDetailApi = PrefeituraConsultasUnitDetail

export async function apiFetchPrefeituraConsultasOverview(
  accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<PrefeituraConsultasOverviewApi> {
  try {
    const query = new URLSearchParams({
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    })
    if (params.unidadeUbtId) query.set('unidadeUbtId', params.unidadeUbtId)
    if (params.regionKey) query.set('regionKey', params.regionKey)

    return await apiFetch<PrefeituraConsultasOverviewApi>(
      `/prefeitura/consultas/overview?${query.toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraConsultasUnitDetail(
  accessToken: string,
  unitId: string,
  periodStart: string,
  periodEnd: string,
): Promise<PrefeituraConsultasUnitDetailApi> {
  try {
    const query = new URLSearchParams({ periodStart, periodEnd })
    const data = await apiFetch<{ detail: PrefeituraConsultasUnitDetailApi }>(
      `/prefeitura/consultas/units/${unitId}?${query.toString()}`,
      { accessToken },
    )
    return data.detail
  } catch (error) {
    throw mapError(error)
  }
}

export function isPrefeituraConsultasApiError(error: unknown): error is PrefeituraConsultasApiError {
  return error instanceof PrefeituraConsultasApiError
}

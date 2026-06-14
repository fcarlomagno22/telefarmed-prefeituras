import type {
  MonitorComparisonRow,
  MonitorComparisonTab,
} from '../../../types/prefeituraMonitor'
import type { PrefeituraMonitorOverview } from '../../mockServices/prefeitura/monitor'
import { ApiError, apiFetch } from '../http'

export class PrefeituraMonitorApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PrefeituraMonitorApiError'
  }
}

function mapError(error: unknown): PrefeituraMonitorApiError {
  if (error instanceof ApiError) {
    return new PrefeituraMonitorApiError(error.message, error.status, error.code)
  }
  return new PrefeituraMonitorApiError('Não foi possível completar a requisição.', 0)
}

export async function apiFetchPrefeituraMonitorOverview(
  accessToken: string,
  params: { regionKey: string; timelinePeriod: string },
): Promise<PrefeituraMonitorOverview> {
  try {
    const query = new URLSearchParams({
      regionKey: params.regionKey,
      timelinePeriod: params.timelinePeriod,
    })
    return await apiFetch<PrefeituraMonitorOverview>(`/prefeitura/monitor/overview?${query}`, {
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchPrefeituraMonitorRanking(
  accessToken: string,
  params: { tab: MonitorComparisonTab; regionKey: string; timelinePeriod: string },
): Promise<MonitorComparisonRow[]> {
  try {
    const query = new URLSearchParams({
      tab: params.tab,
      regionKey: params.regionKey,
      timelinePeriod: params.timelinePeriod,
    })
    const data = await apiFetch<{ rows: MonitorComparisonRow[] }>(
      `/prefeitura/monitor/ranking?${query}`,
      { accessToken },
    )
    return data.rows
  } catch (error) {
    throw mapError(error)
  }
}

export function isPrefeituraMonitorApiError(error: unknown): error is PrefeituraMonitorApiError {
  return error instanceof PrefeituraMonitorApiError
}

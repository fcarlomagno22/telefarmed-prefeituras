import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/prefeitura/dashboard'
import {
  PrefeituraDashboardApiError as MockPrefeituraDashboardApiError,
  computeMockPrefeituraPackageUsage,
  fetchPrefeituraDashboardOverview as mockFetchPrefeituraDashboardOverview,
  isPrefeituraDashboardApiError as mockIsPrefeituraDashboardApiError,
  mapOverviewKpisToCards,
  mapOverviewToDashboardView,
  type PrefeituraDashboardOverviewData,
  type PrefeituraDashboardView,
} from '../../mockServices/prefeitura/dashboard'

export type { PrefeituraDashboardOverviewData, PrefeituraDashboardView }
export { mapOverviewKpisToCards, mapOverviewToDashboardView, computeMockPrefeituraPackageUsage }

export const PrefeituraDashboardApiError = isBackendApiEnabled()
  ? api.PrefeituraDashboardApiError
  : MockPrefeituraDashboardApiError

type PrefeituraDashboardApiErrorInstance = InstanceType<typeof PrefeituraDashboardApiError>

export function isPrefeituraDashboardApiError(
  error: unknown,
): error is PrefeituraDashboardApiErrorInstance {
  if (isBackendApiEnabled()) {
    return error instanceof api.PrefeituraDashboardApiError
  }
  return mockIsPrefeituraDashboardApiError(error)
}

export async function fetchPrefeituraDashboardOverview(
  accessToken: string,
  params: { period: string; regionKey: string; unidadeUbtId?: string },
) {
  if (isBackendApiEnabled()) {
    return api.apiFetchPrefeituraDashboardOverview(accessToken, params)
  }
  return mockFetchPrefeituraDashboardOverview(accessToken, params)
}

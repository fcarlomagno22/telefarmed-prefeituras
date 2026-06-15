import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/prefeitura/posConsultaDashboard'
import {
  fetchPrefeituraPosConsultaDashboard as mockFetchPrefeituraPosConsultaDashboard,
  isPrefeituraPosConsultaDashboardApiError as mockIsPrefeituraPosConsultaDashboardApiError,
  mapPrefeituraPosConsultaDashboardToKpiCards,
  PrefeituraPosConsultaDashboardApiError as MockPrefeituraPosConsultaDashboardApiError,
} from '../../mockServices/prefeitura/posConsultaDashboard'
import type { PrefeituraPosConsultaDashboardFilters } from '../../../types/prefeituraPosConsultaDashboard'

export type {
  PrefeituraPosConsultaDashboardFilters,
  PrefeituraPosConsultaDashboardKpis,
  PrefeituraPosConsultaDashboardView,
  PrefeituraPosConsultaEvolucaoSlice,
} from '../../../types/prefeituraPosConsultaDashboard'

export { mapPrefeituraPosConsultaDashboardToKpiCards }

export const PrefeituraPosConsultaDashboardApiError = isBackendApiEnabled()
  ? api.PrefeituraPosConsultaDashboardApiError
  : MockPrefeituraPosConsultaDashboardApiError

export const isPrefeituraPosConsultaDashboardApiError = isBackendApiEnabled()
  ? api.isPrefeituraPosConsultaDashboardApiError
  : mockIsPrefeituraPosConsultaDashboardApiError

export async function fetchPrefeituraPosConsultaDashboard(
  accessToken: string,
  filters: PrefeituraPosConsultaDashboardFilters,
) {
  if (isBackendApiEnabled()) {
    return api.apiFetchPrefeituraPosConsultaDashboard(accessToken, filters)
  }
  return mockFetchPrefeituraPosConsultaDashboard(accessToken, filters)
}

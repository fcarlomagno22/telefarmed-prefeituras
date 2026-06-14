import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/prefeitura/consultas'
import {
  PrefeituraConsultasApiError as MockPrefeituraConsultasApiError,
  fetchPrefeituraConsultasOverview as mockFetchPrefeituraConsultasOverview,
  fetchPrefeituraConsultasUnitDetail as mockFetchPrefeituraConsultasUnitDetail,
  isPrefeituraConsultasApiError as mockIsPrefeituraConsultasApiError,
  type PrefeituraConsultasOverviewApi,
  type PrefeituraConsultasUnitDetailApi,
} from '../../mockServices/prefeitura/consultas'

export type { PrefeituraConsultasOverviewApi, PrefeituraConsultasUnitDetailApi }

export const PrefeituraConsultasApiError = isBackendApiEnabled()
  ? api.PrefeituraConsultasApiError
  : MockPrefeituraConsultasApiError

export function isPrefeituraConsultasApiError(
  error: unknown,
): error is InstanceType<typeof PrefeituraConsultasApiError> {
  if (isBackendApiEnabled()) {
    return api.isPrefeituraConsultasApiError(error)
  }
  return mockIsPrefeituraConsultasApiError(error)
}

export const fetchPrefeituraConsultasOverview = isBackendApiEnabled()
  ? api.apiFetchPrefeituraConsultasOverview
  : mockFetchPrefeituraConsultasOverview

export const fetchPrefeituraConsultasUnitDetail = isBackendApiEnabled()
  ? api.apiFetchPrefeituraConsultasUnitDetail
  : mockFetchPrefeituraConsultasUnitDetail

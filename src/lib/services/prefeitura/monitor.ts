import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/prefeitura/monitor'
import {
  PrefeituraMonitorApiError as MockPrefeituraMonitorApiError,
  fetchPrefeituraMonitorOverview as mockFetchPrefeituraMonitorOverview,
  fetchPrefeituraMonitorRanking as mockFetchPrefeituraMonitorRanking,
  isPrefeituraMonitorApiError as mockIsPrefeituraMonitorApiError,
  type PrefeituraMonitorOverview,
} from '../../mockServices/prefeitura/monitor'

export type { PrefeituraMonitorOverview }

export const PrefeituraMonitorApiError = isBackendApiEnabled()
  ? api.PrefeituraMonitorApiError
  : MockPrefeituraMonitorApiError

export function isPrefeituraMonitorApiError(
  error: unknown,
): error is InstanceType<typeof PrefeituraMonitorApiError> {
  if (isBackendApiEnabled()) {
    return api.isPrefeituraMonitorApiError(error)
  }
  return mockIsPrefeituraMonitorApiError(error)
}

export const fetchPrefeituraMonitorOverview = isBackendApiEnabled()
  ? api.apiFetchPrefeituraMonitorOverview
  : mockFetchPrefeituraMonitorOverview

export const fetchPrefeituraMonitorRanking = isBackendApiEnabled()
  ? api.apiFetchPrefeituraMonitorRanking
  : mockFetchPrefeituraMonitorRanking

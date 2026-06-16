import { isLiveShareDemoToken } from '../../../data/runWalkLiveSharePublicMock'
import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/public/runWalkLiveShare'
import { mockFetchLiveShareSession } from '../../mockServices/public/runWalkLiveShare'
import type { LiveShareSessionPublicResult } from '../../../types/runWalkLiveSharePublic'

const useApi = isBackendApiEnabled()

export const RunWalkLiveSharePublicApiError = api.RunWalkLiveSharePublicApiError
export const isRunWalkLiveSharePublicApiError = api.isRunWalkLiveSharePublicApiError

export async function fetchLiveShareSession(
  token: string,
): Promise<LiveShareSessionPublicResult> {
  if (isLiveShareDemoToken(token)) {
    return mockFetchLiveShareSession()
  }

  if (!useApi) {
    throw new api.RunWalkLiveSharePublicApiError(
      'Acompanhamento ao vivo indisponível neste ambiente.',
      'UNAVAILABLE',
      503,
    )
  }

  return api.apiFetchLiveShareSession(token)
}

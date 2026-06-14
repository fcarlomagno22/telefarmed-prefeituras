import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/prefeitura/auth'
import {
  PrefeituraAuthApiError as MockPrefeituraAuthApiError,
  mockPrefeituraLogin,
  readPrefeituraMockSession,
  verifyPrefeituraAuthorizationPin as mockVerifyPrefeituraAuthorizationPin,
  type PrefeituraAuthUser,
} from '../../mockAuth/prefeituraAuthMock'

export type { PrefeituraAuthUser }
export const PrefeituraAuthApiError = isBackendApiEnabled()
  ? api.PrefeituraAuthApiError
  : MockPrefeituraAuthApiError

export async function prefeituraLogin(credentials: { cpf: string; password: string }) {
  if (isBackendApiEnabled()) {
    return api.apiPrefeituraLogin(credentials)
  }
  return mockPrefeituraLogin(credentials)
}

export async function prefeituraRefreshSession() {
  if (!isBackendApiEnabled()) {
    throw new MockPrefeituraAuthApiError('Refresh indisponível no modo mock.', 400)
  }
  return api.apiPrefeituraRefresh()
}

export async function prefeituraLogout() {
  if (isBackendApiEnabled()) {
    await api.apiPrefeituraLogout()
  }
}

export async function verifyPrefeituraAuthorizationPin(accessToken: string, pin: string) {
  if (isBackendApiEnabled()) {
    return api.apiVerifyPrefeituraAuthorizationPin(accessToken, pin)
  }
  return mockVerifyPrefeituraAuthorizationPin(accessToken, pin)
}

export async function prefeituraFetchCurrentUser(accessToken: string) {
  if (!isBackendApiEnabled()) {
    const session = readPrefeituraMockSession()
    if (!session.user) {
      throw new MockPrefeituraAuthApiError('Não autenticado.', 401)
    }
    return session.user
  }
  return api.apiPrefeituraMe(accessToken)
}

export { readPrefeituraMockSession, writePrefeituraMockSession } from '../../mockAuth/prefeituraAuthMock'

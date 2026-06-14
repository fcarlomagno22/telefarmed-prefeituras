import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/profissional/auth'
import {
  ProfissionalAuthApiError as MockProfissionalAuthApiError,
  mockProfissionalLogin,
  readProfissionalMockSession,
  writeProfissionalMockSession,
  type ProfissionalAuthUser,
} from '../../mockAuth/profissionalAuthMock'

export type { ProfissionalAuthUser }

export const ProfissionalAuthApiError = isBackendApiEnabled()
  ? api.ProfissionalAuthApiError
  : MockProfissionalAuthApiError

export async function profissionalLogin(credentials: { cpf: string; password: string }) {
  if (isBackendApiEnabled()) {
    return api.apiProfissionalLogin(credentials)
  }
  return mockProfissionalLogin(credentials)
}

export async function profissionalRefreshSession() {
  if (!isBackendApiEnabled()) {
    throw new MockProfissionalAuthApiError('Refresh indisponível no modo mock.', 400)
  }
  return api.apiProfissionalRefresh()
}

export async function profissionalLogout() {
  if (isBackendApiEnabled()) {
    await api.apiProfissionalLogout()
  }
}

export async function profissionalFetchCurrentUser(accessToken: string) {
  if (!isBackendApiEnabled()) {
    const session = readProfissionalMockSession()
    if (!session.user) {
      throw new MockProfissionalAuthApiError('Não autenticado.', 401)
    }
    return session.user
  }
  return api.apiProfissionalMe(accessToken)
}

export { readProfissionalMockSession, writeProfissionalMockSession }

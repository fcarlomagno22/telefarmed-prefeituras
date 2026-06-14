import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/auth'
import {
  AdminAuthApiError as MockAdminAuthApiError,
  mockAdminLogin,
  readAdminMockSession,
  verifyAdminAuthorizationPin as mockVerifyAdminAuthorizationPin,
  type AdminAuthUser,
} from '../../mockAuth/adminAuthMock'

export type { AdminAuthUser }
export const AdminAuthApiError = isBackendApiEnabled() ? api.AdminAuthApiError : MockAdminAuthApiError

export async function adminLogin(credentials: { cpf: string; password: string }) {
  if (isBackendApiEnabled()) {
    return api.apiAdminLogin(credentials)
  }
  return mockAdminLogin(credentials)
}

export async function adminRefreshSession() {
  if (!isBackendApiEnabled()) {
    throw new MockAdminAuthApiError('Refresh indisponível no modo mock.', 400)
  }
  return api.apiAdminRefresh()
}

export async function adminLogout() {
  if (isBackendApiEnabled()) {
    await api.apiAdminLogout()
  }
}

export async function verifyAdminAuthorizationPin(accessToken: string, pin: string) {
  if (isBackendApiEnabled()) {
    return api.apiVerifyAdminAuthorizationPin(accessToken, pin)
  }
  return mockVerifyAdminAuthorizationPin(accessToken, pin)
}

export async function adminFetchCurrentUser(accessToken: string) {
  if (!isBackendApiEnabled()) {
    const session = readAdminMockSession()
    if (!session.user) {
      throw new MockAdminAuthApiError('Não autenticado.', 401)
    }
    return session.user
  }
  return api.apiAdminMe(accessToken)
}

// Re-export para sessão local (login / refresh)
export { readAdminMockSession, writeAdminMockSession } from '../../mockAuth/adminAuthMock'

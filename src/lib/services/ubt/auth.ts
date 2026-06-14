import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/ubt/auth'
import {
  UbtAuthApiError as MockUbtAuthApiError,
  mockUbtLogin,
  readUbtMockSession,
  unlockUbtLgpd as mockUnlockUbtLgpd,
  checkUbtLgpdUnlockStatus as mockCheckUbtLgpdUnlockStatus,
  type UbtAuthUser,
} from '../../mockAuth/ubtAuthMock'
import { clearLgpdSession } from '../../../utils/lgpdSession'

export type { UbtAuthUser, UbtSystemPermissions } from '../../mockAuth/ubtAuthMock'

export const UbtAuthApiError = isBackendApiEnabled() ? api.UbtAuthApiError : MockUbtAuthApiError

export async function ubtLogin(credentials: { cpf: string; password: string }) {
  if (isBackendApiEnabled()) {
    return api.apiUbtLogin(credentials)
  }
  return mockUbtLogin(credentials)
}

export async function ubtRefreshSession() {
  if (!isBackendApiEnabled()) {
    throw new MockUbtAuthApiError('Refresh indisponível no modo mock.', 400)
  }
  return api.apiUbtRefresh()
}

export async function ubtLogout() {
  if (isBackendApiEnabled()) {
    await api.apiUbtLogout()
  }
}

export async function ubtFetchCurrentUser(accessToken: string) {
  if (!isBackendApiEnabled()) {
    const session = readUbtMockSession()
    if (!session.user) {
      throw new MockUbtAuthApiError('Não autenticado.', 401)
    }
    return session.user
  }
  return api.apiUbtMe(accessToken)
}

export async function checkUbtLgpdUnlockStatus(
  accessToken: string,
  lgpdUnlockToken: string,
  _operatorId?: string,
): Promise<boolean> {
  if (!isBackendApiEnabled()) {
    return mockCheckUbtLgpdUnlockStatus(accessToken, lgpdUnlockToken)
  }

  return api.apiCheckUbtLgpdUnlockStatus(accessToken, lgpdUnlockToken)
}

export async function unlockUbtLgpd(accessToken: string, pin: string) {
  if (isBackendApiEnabled()) {
    return api.apiUnlockUbtLgpd(accessToken, pin)
  }
  return mockUnlockUbtLgpd(accessToken, pin)
}

export async function revokeUbtLgpd(accessToken: string, lgpdUnlockToken: string) {
  if (isBackendApiEnabled()) {
    await api.apiRevokeUbtLgpd(accessToken, lgpdUnlockToken)
  }
}

export { readUbtMockSession, writeUbtMockSession } from '../../mockAuth/ubtAuthMock'

export { clearLgpdSession } from '../../../utils/lgpdSession'

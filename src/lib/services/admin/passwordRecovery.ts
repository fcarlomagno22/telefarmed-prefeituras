import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/passwordRecovery'
import {
  mockAdminCompletePasswordRecovery,
  mockAdminRequestPasswordRecovery,
  mockAdminVerifyPasswordRecoveryCode,
  AdminPasswordRecoveryError as MockAdminPasswordRecoveryError,
} from '../../mockAuth/adminPasswordRecoveryMock'

export { ADMIN_PASSWORD_RECOVERY_MOCK_HINT } from '../../mockAuth/adminPasswordRecoveryMock'

export const AdminPasswordRecoveryError = isBackendApiEnabled()
  ? api.AdminPasswordRecoveryApiError
  : MockAdminPasswordRecoveryError

function mapApiError(error: unknown): never {
  if (error instanceof api.AdminPasswordRecoveryApiError) {
    throw error
  }
  throw new api.AdminPasswordRecoveryApiError('Não foi possível completar a requisição.', 0)
}

export async function adminRequestPasswordRecovery(cpf: string) {
  if (isBackendApiEnabled()) {
    try {
      return await api.apiAdminRequestPasswordRecovery(cpf)
    } catch (error) {
      mapApiError(error)
    }
  }
  return mockAdminRequestPasswordRecovery(cpf)
}

export async function adminVerifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}) {
  if (isBackendApiEnabled()) {
    try {
      return await api.apiAdminVerifyPasswordRecoveryCode(input)
    } catch (error) {
      mapApiError(error)
    }
  }
  return mockAdminVerifyPasswordRecoveryCode(input)
}

export async function adminCompletePasswordRecovery(input: {
  verificationToken: string
  password: string
}) {
  if (isBackendApiEnabled()) {
    try {
      return await api.apiAdminCompletePasswordRecovery(input)
    } catch (error) {
      mapApiError(error)
    }
  }
  return mockAdminCompletePasswordRecovery(input)
}

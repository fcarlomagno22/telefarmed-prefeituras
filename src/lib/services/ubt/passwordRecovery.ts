import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/ubt/passwordRecovery'
import {
  mockUbtCompletePasswordRecovery,
  mockUbtRequestPasswordRecovery,
  mockUbtVerifyPasswordRecoveryCode,
  UbtPasswordRecoveryError as MockUbtPasswordRecoveryError,
} from '../../mockAuth/ubtPasswordRecoveryMock'

export { UBT_PASSWORD_RECOVERY_MOCK_HINT } from '../../mockAuth/ubtPasswordRecoveryMock'

export const UbtPasswordRecoveryError = isBackendApiEnabled()
  ? api.UbtPasswordRecoveryApiError
  : MockUbtPasswordRecoveryError

function mapApiError(error: unknown): never {
  if (error instanceof api.UbtPasswordRecoveryApiError) {
    throw error
  }
  throw new api.UbtPasswordRecoveryApiError('Não foi possível completar a requisição.', 0)
}

export async function ubtRequestPasswordRecovery(cpf: string) {
  if (isBackendApiEnabled()) {
    try {
      return await api.apiUbtRequestPasswordRecovery(cpf)
    } catch (error) {
      mapApiError(error)
    }
  }
  return mockUbtRequestPasswordRecovery(cpf)
}

export async function ubtVerifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}) {
  if (isBackendApiEnabled()) {
    try {
      return await api.apiUbtVerifyPasswordRecoveryCode(input)
    } catch (error) {
      mapApiError(error)
    }
  }
  return mockUbtVerifyPasswordRecoveryCode(input)
}

export async function ubtCompletePasswordRecovery(input: {
  verificationToken: string
  password: string
}) {
  if (isBackendApiEnabled()) {
    try {
      return await api.apiUbtCompletePasswordRecovery(input)
    } catch (error) {
      mapApiError(error)
    }
  }
  return mockUbtCompletePasswordRecovery(input)
}

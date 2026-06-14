import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/prefeitura/passwordRecovery'
import {
  mockPrefeituraCompletePasswordRecovery,
  mockPrefeituraRequestPasswordRecovery,
  mockPrefeituraVerifyPasswordRecoveryCode,
  PrefeituraPasswordRecoveryError as MockPrefeituraPasswordRecoveryError,
} from '../../mockAuth/prefeituraPasswordRecoveryMock'

export { PREFEITURA_PASSWORD_RECOVERY_MOCK_HINT } from '../../mockAuth/prefeituraPasswordRecoveryMock'

export const PrefeituraPasswordRecoveryError = isBackendApiEnabled()
  ? api.PrefeituraPasswordRecoveryApiError
  : MockPrefeituraPasswordRecoveryError

function mapApiError(error: unknown): never {
  if (error instanceof api.PrefeituraPasswordRecoveryApiError) {
    throw error
  }
  throw new api.PrefeituraPasswordRecoveryApiError('Não foi possível completar a requisição.', 0)
}

export async function prefeituraRequestPasswordRecovery(cpf: string) {
  if (isBackendApiEnabled()) {
    try {
      return await api.apiPrefeituraRequestPasswordRecovery(cpf)
    } catch (error) {
      mapApiError(error)
    }
  }
  return mockPrefeituraRequestPasswordRecovery(cpf)
}

export async function prefeituraVerifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}) {
  if (isBackendApiEnabled()) {
    try {
      return await api.apiPrefeituraVerifyPasswordRecoveryCode(input)
    } catch (error) {
      mapApiError(error)
    }
  }
  return mockPrefeituraVerifyPasswordRecoveryCode(input)
}

export async function prefeituraCompletePasswordRecovery(input: {
  verificationToken: string
  password: string
}) {
  if (isBackendApiEnabled()) {
    try {
      return await api.apiPrefeituraCompletePasswordRecovery(input)
    } catch (error) {
      mapApiError(error)
    }
  }
  return mockPrefeituraCompletePasswordRecovery(input)
}

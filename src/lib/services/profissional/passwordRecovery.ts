import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/profissional/passwordRecovery'
import {
  mockProfissionalCompletePasswordRecovery,
  mockProfissionalRequestPasswordRecovery,
  mockProfissionalVerifyPasswordRecoveryCode,
  ProfissionalPasswordRecoveryError as MockProfissionalPasswordRecoveryError,
} from '../../mockAuth/profissionalPasswordRecoveryMock'

export { PROFISSIONAL_PASSWORD_RECOVERY_MOCK_HINT } from '../../mockAuth/profissionalPasswordRecoveryMock'

export const ProfissionalPasswordRecoveryError = isBackendApiEnabled()
  ? api.ProfissionalPasswordRecoveryApiError
  : MockProfissionalPasswordRecoveryError

function mapApiError(error: unknown): never {
  if (error instanceof api.ProfissionalPasswordRecoveryApiError) {
    throw error
  }
  throw new api.ProfissionalPasswordRecoveryApiError('Não foi possível completar a requisição.', 0)
}

export async function profissionalRequestPasswordRecovery(cpf: string) {
  if (isBackendApiEnabled()) {
    try {
      return await api.apiProfissionalRequestPasswordRecovery(cpf)
    } catch (error) {
      mapApiError(error)
    }
  }
  return mockProfissionalRequestPasswordRecovery(cpf)
}

export async function profissionalVerifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}) {
  if (isBackendApiEnabled()) {
    try {
      return await api.apiProfissionalVerifyPasswordRecoveryCode(input)
    } catch (error) {
      mapApiError(error)
    }
  }
  return mockProfissionalVerifyPasswordRecoveryCode(input)
}

export async function profissionalCompletePasswordRecovery(input: {
  verificationToken: string
  password: string
}) {
  if (isBackendApiEnabled()) {
    try {
      return await api.apiProfissionalCompletePasswordRecovery(input)
    } catch (error) {
      mapApiError(error)
    }
  }
  return mockProfissionalCompletePasswordRecovery(input)
}

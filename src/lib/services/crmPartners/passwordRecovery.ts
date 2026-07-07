import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/crmPartners/passwordRecovery'
import {
  mockCrmPartnersCompletePasswordRecovery,
  mockCrmPartnersRequestPasswordRecovery,
  mockCrmPartnersVerifyPasswordRecoveryCode,
  CrmPartnersPasswordRecoveryError as MockCrmPartnersPasswordRecoveryError,
} from '../../mockAuth/crmPartnersPasswordRecoveryMock'

export { CRM_PARTNERS_PASSWORD_RECOVERY_MOCK_HINT } from '../../mockAuth/crmPartnersPasswordRecoveryMock'

export const CrmPartnersPasswordRecoveryError = isBackendApiEnabled()
  ? api.CrmPartnersPasswordRecoveryApiError
  : MockCrmPartnersPasswordRecoveryError

function mapApiError(error: unknown): never {
  if (error instanceof api.CrmPartnersPasswordRecoveryApiError) {
    throw error
  }
  throw new api.CrmPartnersPasswordRecoveryApiError('Não foi possível completar a requisição.', 0)
}

export async function crmPartnersRequestPasswordRecovery(cpf: string) {
  if (isBackendApiEnabled()) {
    try {
      return await api.apiCrmPartnersRequestPasswordRecovery(cpf)
    } catch (error) {
      mapApiError(error)
    }
  }
  return mockCrmPartnersRequestPasswordRecovery(cpf)
}

export async function crmPartnersVerifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}) {
  if (isBackendApiEnabled()) {
    try {
      return await api.apiCrmPartnersVerifyPasswordRecoveryCode(input)
    } catch (error) {
      mapApiError(error)
    }
  }
  return mockCrmPartnersVerifyPasswordRecoveryCode(input)
}

export async function crmPartnersCompletePasswordRecovery(input: {
  verificationToken: string
  password: string
}) {
  if (isBackendApiEnabled()) {
    try {
      return await api.apiCrmPartnersCompletePasswordRecovery(input)
    } catch (error) {
      mapApiError(error)
    }
  }
  return mockCrmPartnersCompletePasswordRecovery(input)
}

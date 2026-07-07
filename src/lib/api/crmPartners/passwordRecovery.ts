import { ApiError, apiFetch } from '../http'

export class CrmPartnersPasswordRecoveryApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'CrmPartnersPasswordRecoveryApiError'
  }
}

function mapApiError(error: unknown): CrmPartnersPasswordRecoveryApiError {
  if (error instanceof ApiError) {
    return new CrmPartnersPasswordRecoveryApiError(error.message, error.status, error.code)
  }
  return new CrmPartnersPasswordRecoveryApiError('Não foi possível completar a requisição.', 0)
}

export type CrmPartnersPasswordRecoveryRequestResult = {
  resetToken: string
  sentTo: string
  expiresInMinutes: number
  sentAt: string
}

export async function apiCrmPartnersRequestPasswordRecovery(
  cpf: string,
): Promise<CrmPartnersPasswordRecoveryRequestResult> {
  try {
    return await apiFetch('/crm-partners/auth/recuperacao-senha/solicitar', {
      method: 'POST',
      json: { cpf },
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiCrmPartnersVerifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}): Promise<{ verificationToken: string }> {
  try {
    return await apiFetch('/crm-partners/auth/recuperacao-senha/verificar-codigo', {
      method: 'POST',
      json: input,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiCrmPartnersCompletePasswordRecovery(input: {
  verificationToken: string
  password: string
}): Promise<void> {
  try {
    await apiFetch('/crm-partners/auth/recuperacao-senha/concluir', {
      method: 'POST',
      json: input,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

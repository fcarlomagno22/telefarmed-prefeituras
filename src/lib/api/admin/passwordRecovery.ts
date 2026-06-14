import { ApiError, apiFetch } from '../http'

export class AdminPasswordRecoveryApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'AdminPasswordRecoveryApiError'
  }
}

function mapApiError(error: unknown): AdminPasswordRecoveryApiError {
  if (error instanceof ApiError) {
    return new AdminPasswordRecoveryApiError(error.message, error.status, error.code)
  }
  return new AdminPasswordRecoveryApiError('Não foi possível completar a requisição.', 0)
}

export type AdminPasswordRecoveryRequestResult = {
  resetToken: string
  sentTo: string
  expiresInMinutes: number
  sentAt: string
}

export async function apiAdminRequestPasswordRecovery(
  cpf: string,
): Promise<AdminPasswordRecoveryRequestResult> {
  try {
    return await apiFetch('/admin/auth/recuperacao-senha/solicitar', {
      method: 'POST',
      json: { cpf },
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiAdminVerifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}): Promise<{ verificationToken: string }> {
  try {
    return await apiFetch('/admin/auth/recuperacao-senha/verificar-codigo', {
      method: 'POST',
      json: input,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiAdminCompletePasswordRecovery(input: {
  verificationToken: string
  password: string
}): Promise<void> {
  try {
    await apiFetch('/admin/auth/recuperacao-senha/concluir', {
      method: 'POST',
      json: input,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

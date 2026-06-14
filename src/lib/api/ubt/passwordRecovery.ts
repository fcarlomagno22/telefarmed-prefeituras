import { ApiError, apiFetch } from '../http'

export class UbtPasswordRecoveryApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'UbtPasswordRecoveryApiError'
  }
}

function mapApiError(error: unknown): UbtPasswordRecoveryApiError {
  if (error instanceof ApiError) {
    return new UbtPasswordRecoveryApiError(error.message, error.status, error.code)
  }
  return new UbtPasswordRecoveryApiError('Não foi possível completar a requisição.', 0)
}

export type UbtPasswordRecoveryRequestResult = {
  resetToken: string
  sentTo: string
  expiresInMinutes: number
  sentAt: string
}

export async function apiUbtRequestPasswordRecovery(
  cpf: string,
): Promise<UbtPasswordRecoveryRequestResult> {
  try {
    return await apiFetch('/ubt/auth/recuperacao-senha/solicitar', {
      method: 'POST',
      json: { cpf },
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiUbtVerifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}): Promise<{ verificationToken: string }> {
  try {
    return await apiFetch('/ubt/auth/recuperacao-senha/verificar-codigo', {
      method: 'POST',
      json: input,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiUbtCompletePasswordRecovery(input: {
  verificationToken: string
  password: string
}): Promise<void> {
  try {
    await apiFetch('/ubt/auth/recuperacao-senha/concluir', {
      method: 'POST',
      json: input,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

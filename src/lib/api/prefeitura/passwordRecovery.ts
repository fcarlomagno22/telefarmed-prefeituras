import { ApiError, apiFetch } from '../http'

export class PrefeituraPasswordRecoveryApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PrefeituraPasswordRecoveryApiError'
  }
}

function mapApiError(error: unknown): PrefeituraPasswordRecoveryApiError {
  if (error instanceof ApiError) {
    return new PrefeituraPasswordRecoveryApiError(error.message, error.status, error.code)
  }
  return new PrefeituraPasswordRecoveryApiError('Não foi possível completar a requisição.', 0)
}

export type PrefeituraPasswordRecoveryRequestResult = {
  resetToken: string
  sentTo: string
  expiresInMinutes: number
  sentAt: string
}

export async function apiPrefeituraRequestPasswordRecovery(
  cpf: string,
): Promise<PrefeituraPasswordRecoveryRequestResult> {
  try {
    return await apiFetch('/prefeitura/auth/recuperacao-senha/solicitar', {
      method: 'POST',
      json: { cpf },
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiPrefeituraVerifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}): Promise<{ verificationToken: string }> {
  try {
    return await apiFetch('/prefeitura/auth/recuperacao-senha/verificar-codigo', {
      method: 'POST',
      json: input,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiPrefeituraCompletePasswordRecovery(input: {
  verificationToken: string
  password: string
}): Promise<void> {
  try {
    await apiFetch('/prefeitura/auth/recuperacao-senha/concluir', {
      method: 'POST',
      json: input,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

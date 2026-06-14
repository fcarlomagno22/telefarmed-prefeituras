import { ApiError, apiFetch } from '../http'

export class ProfissionalPasswordRecoveryApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'ProfissionalPasswordRecoveryApiError'
  }
}

function mapApiError(error: unknown): ProfissionalPasswordRecoveryApiError {
  if (error instanceof ApiError) {
    return new ProfissionalPasswordRecoveryApiError(error.message, error.status, error.code)
  }
  return new ProfissionalPasswordRecoveryApiError('Não foi possível completar a requisição.', 0)
}

export type ProfissionalPasswordRecoveryRequestResult = {
  resetToken: string
  sentTo: string
  expiresInMinutes: number
  sentAt: string
}

export async function apiProfissionalRequestPasswordRecovery(
  cpf: string,
): Promise<ProfissionalPasswordRecoveryRequestResult> {
  try {
    return await apiFetch('/profissional/auth/recuperacao-senha/solicitar', {
      method: 'POST',
      json: { cpf },
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiProfissionalVerifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}): Promise<{ verificationToken: string }> {
  try {
    return await apiFetch('/profissional/auth/recuperacao-senha/verificar-codigo', {
      method: 'POST',
      json: input,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiProfissionalCompletePasswordRecovery(input: {
  verificationToken: string
  password: string
}): Promise<void> {
  try {
    await apiFetch('/profissional/auth/recuperacao-senha/concluir', {
      method: 'POST',
      json: input,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

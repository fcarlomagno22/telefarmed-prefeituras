import type { ProfissionalAuthUser } from '../../mockAuth/profissionalAuthMock'
import { ApiError, apiFetch } from '../http'

export class ProfissionalAuthApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'ProfissionalAuthApiError'
  }
}

function mapApiError(error: unknown): ProfissionalAuthApiError {
  if (error instanceof ApiError) {
    return new ProfissionalAuthApiError(error.message, error.status, error.code)
  }
  return new ProfissionalAuthApiError('Não foi possível completar a requisição.', 0)
}

export async function apiProfissionalLogin(credentials: {
  cpf: string
  password: string
}): Promise<{ accessToken: string; user: ProfissionalAuthUser }> {
  try {
    return await apiFetch('/profissional/auth/login', {
      method: 'POST',
      json: credentials,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiProfissionalRefresh(): Promise<{
  accessToken: string
  user: ProfissionalAuthUser
}> {
  try {
    return await apiFetch('/profissional/auth/refresh', { method: 'POST' })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiProfissionalLogout(): Promise<void> {
  try {
    await apiFetch('/profissional/auth/logout', { method: 'POST' })
  } catch {
    // logout idempotente no cliente
  }
}

export async function apiProfissionalMe(accessToken: string): Promise<ProfissionalAuthUser> {
  try {
    const data = await apiFetch<{ user: ProfissionalAuthUser }>('/profissional/auth/me', {
      accessToken,
    })
    return data.user
  } catch (error) {
    throw mapApiError(error)
  }
}

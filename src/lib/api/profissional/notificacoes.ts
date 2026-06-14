import type {
  ProfissionalNotificationKpisResponse,
  ProfissionalNotificationListResponse,
} from '../../mockServices/profissional/notificacoes'
import { ApiError, apiFetch } from '../http'

export class ProfissionalNotificacoesApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'ProfissionalNotificacoesApiError'
  }
}

function mapApiError(error: unknown): ProfissionalNotificacoesApiError {
  if (error instanceof ApiError) {
    return new ProfissionalNotificacoesApiError(error.message, error.status, error.code)
  }
  return new ProfissionalNotificacoesApiError('Não foi possível completar a requisição.', 0)
}

export function isProfissionalNotificacoesApiError(
  error: unknown,
): error is ProfissionalNotificacoesApiError {
  return error instanceof ProfissionalNotificacoesApiError
}

function buildQuery(params?: Record<string, string | number | undefined>) {
  const query = new URLSearchParams()
  if (!params) return ''
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  return query.toString() ? `?${query.toString()}` : ''
}

export async function fetchProfissionalNotificationKpis(accessToken: string) {
  try {
    return await apiFetch<ProfissionalNotificationKpisResponse>('/profissional/notificacoes/kpis', {
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchProfissionalNotifications(
  accessToken: string,
  params?: {
    origin?: string
    read?: 'all' | 'unread' | 'read'
    search?: string
    page?: number
    pageSize?: number
  },
) {
  try {
    return await apiFetch<ProfissionalNotificationListResponse>(
      `/profissional/notificacoes${buildQuery(params)}`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function markProfissionalNotificationRead(accessToken: string, id: string) {
  try {
    return await apiFetch<{ ok: true }>(`/profissional/notificacoes/${id}/read`, {
      method: 'PATCH',
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function markAllProfissionalNotificationsRead(accessToken: string) {
  try {
    return await apiFetch<{ count: number }>('/profissional/notificacoes/read-all', {
      method: 'POST',
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

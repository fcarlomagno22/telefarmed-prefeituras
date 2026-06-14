import type {
  CreateUbtBroadcastPayload,
  UbtNotificationKpisResponse,
  UbtNotificationListResponse,
  UbtProfissionalRecipient,
} from '../../mockServices/ubt/notificacoes'
import { ApiError, apiFetch } from '../http'

export class UbtNotificacoesApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'UbtNotificacoesApiError'
  }
}

function mapApiError(error: unknown): UbtNotificacoesApiError {
  if (error instanceof ApiError) {
    return new UbtNotificacoesApiError(error.message, error.status, error.code)
  }
  return new UbtNotificacoesApiError('Não foi possível completar a requisição.', 0)
}

export function isUbtNotificacoesApiError(error: unknown): error is UbtNotificacoesApiError {
  return error instanceof UbtNotificacoesApiError
}

function buildQuery(params?: Record<string, string | number | undefined>) {
  const query = new URLSearchParams()
  if (!params) return ''
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  return query.toString() ? `?${query.toString()}` : ''
}

export async function fetchUbtNotificationKpis(accessToken: string) {
  try {
    return await apiFetch<UbtNotificationKpisResponse>('/ubt/notificacoes/kpis', { accessToken })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchUbtNotifications(
  accessToken: string,
  params?: {
    direction?: 'all' | 'inbox' | 'sent'
    origin?: string
    read?: 'all' | 'unread' | 'read'
    search?: string
    page?: number
    pageSize?: number
  },
) {
  try {
    return await apiFetch<UbtNotificationListResponse>(`/ubt/notificacoes${buildQuery(params)}`, {
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchUbtProfissionaisCatalog(
  accessToken: string,
  params?: { search?: string },
) {
  try {
    return await apiFetch<{ profissionais: UbtProfissionalRecipient[] }>(
      `/ubt/notificacoes/recipients/profissionais${buildQuery(params)}`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function createUbtBroadcast(accessToken: string, payload: CreateUbtBroadcastPayload) {
  try {
    return await apiFetch<{ message: string }>('/ubt/notificacoes/broadcasts', {
      method: 'POST',
      accessToken,
      json: payload,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function markUbtNotificationRead(accessToken: string, id: string) {
  try {
    return await apiFetch<{ ok: true }>(`/ubt/notificacoes/${id}/read`, {
      method: 'PATCH',
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function markAllUbtNotificationsRead(accessToken: string) {
  try {
    return await apiFetch<{ count: number }>('/ubt/notificacoes/read-all', {
      method: 'POST',
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export type { CreateUbtBroadcastPayload, UbtProfissionalRecipient }

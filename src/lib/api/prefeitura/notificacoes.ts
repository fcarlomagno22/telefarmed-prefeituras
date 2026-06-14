import type { PrefeituraNotification } from '../../../data/prefeituraNotificacoesMock'
import type {
  CreatePrefeituraBroadcastPayload,
  PortalNotificationKpisResponse,
  PortalNotificationListResponse,
  PrefeituraBroadcastUbtCatalog,
  PrefeituraProfissionalRecipient,
} from '../../mockServices/prefeitura/notificacoes'
import { ApiError, apiFetch } from '../http'

export class PrefeituraNotificacoesApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PrefeituraNotificacoesApiError'
  }
}

function mapApiError(error: unknown): PrefeituraNotificacoesApiError {
  if (error instanceof ApiError) {
    return new PrefeituraNotificacoesApiError(error.message, error.status, error.code)
  }
  return new PrefeituraNotificacoesApiError('Não foi possível completar a requisição.', 0)
}

export function isPrefeituraNotificacoesApiError(
  error: unknown,
): error is PrefeituraNotificacoesApiError {
  return error instanceof PrefeituraNotificacoesApiError
}

function buildQuery(params?: Record<string, string | number | undefined>) {
  const query = new URLSearchParams()
  if (!params) return ''
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  return query.toString() ? `?${query.toString()}` : ''
}

export async function fetchPrefeituraNotificationKpis(accessToken: string) {
  try {
    return await apiFetch<PortalNotificationKpisResponse>('/prefeitura/notificacoes/kpis', {
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchPrefeituraNotifications(
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
    return await apiFetch<PortalNotificationListResponse>(
      `/prefeitura/notificacoes${buildQuery(params)}`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchPrefeituraBroadcastUbtCatalog(accessToken: string) {
  try {
    return await apiFetch<PrefeituraBroadcastUbtCatalog>(
      '/prefeitura/notificacoes/recipients/ubt',
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchPrefeituraProfissionaisCatalog(
  accessToken: string,
  params?: { search?: string },
) {
  try {
    return await apiFetch<{ profissionais: PrefeituraProfissionalRecipient[] }>(
      `/prefeitura/notificacoes/recipients/profissionais${buildQuery(params)}`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function createPrefeituraBroadcast(
  accessToken: string,
  payload: CreatePrefeituraBroadcastPayload,
) {
  try {
    return await apiFetch<{ message: string; recipientCount: number }>(
      '/prefeitura/notificacoes/broadcasts',
      { method: 'POST', accessToken, json: payload },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function markPrefeituraNotificationRead(accessToken: string, id: string) {
  try {
    return await apiFetch<{ ok: true }>(`/prefeitura/notificacoes/${id}/read`, {
      method: 'PATCH',
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function markAllPrefeituraNotificationsRead(accessToken: string) {
  try {
    return await apiFetch<{ count: number }>('/prefeitura/notificacoes/read-all', {
      method: 'POST',
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export type {
  PrefeituraNotification,
  CreatePrefeituraBroadcastPayload,
  PrefeituraBroadcastUbtCatalog,
  PrefeituraProfissionalRecipient,
}

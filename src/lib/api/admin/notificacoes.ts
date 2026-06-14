import type {
  AdminBroadcast,
  AdminNotificationPriority,
} from '../../../data/adminNotificacoesMock'
import type {
  AdminBroadcastListResponse,
  AdminNotificationKpisResponse,
  AdminRecipientPrefeitura,
  AdminRecipientPrefeituraUser,
  AdminRecipientProfissionaisStats,
  AdminRecipientProfissional,
  AdminRecipientUbt,
  AdminRecipientUbtUser,
  CreateAdminBroadcastPayload,
} from '../../mockServices/admin/notificacoes'
import { ApiError, apiFetch } from '../http'

export class AdminNotificacoesApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'AdminNotificacoesApiError'
  }
}

function mapApiError(error: unknown): AdminNotificacoesApiError {
  if (error instanceof ApiError) {
    return new AdminNotificacoesApiError(error.message, error.status, error.code)
  }
  return new AdminNotificacoesApiError('Não foi possível completar a requisição.', 0)
}

export function isAdminNotificacoesApiError(error: unknown): error is AdminNotificacoesApiError {
  return error instanceof AdminNotificacoesApiError
}

export async function fetchAdminNotificationKpis(accessToken: string) {
  try {
    return await apiFetch<AdminNotificationKpisResponse>('/admin/notificacoes/kpis', { accessToken })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchAdminBroadcasts(
  accessToken: string,
  params?: { search?: string; page?: number; pageSize?: number },
) {
  try {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.page) query.set('page', String(params.page))
    if (params?.pageSize) query.set('pageSize', String(params.pageSize))
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return await apiFetch<AdminBroadcastListResponse>(`/admin/notificacoes/broadcasts${suffix}`, {
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function createAdminBroadcast(accessToken: string, payload: CreateAdminBroadcastPayload) {
  try {
    return await apiFetch<AdminBroadcast>('/admin/notificacoes/broadcasts', {
      method: 'POST',
      accessToken,
      json: payload,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchAdminRecipientPrefeituras(
  accessToken: string,
  params?: { uf?: string; municipality?: string },
) {
  try {
    const query = new URLSearchParams()
    if (params?.uf) query.set('uf', params.uf)
    if (params?.municipality) query.set('municipality', params.municipality)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return await apiFetch<AdminRecipientPrefeitura[]>(
      `/admin/notificacoes/recipients/prefeituras${suffix}`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchAdminRecipientUbts(
  accessToken: string,
  params?: { uf?: string; municipality?: string; prefeituraId?: string },
) {
  try {
    const query = new URLSearchParams()
    if (params?.uf) query.set('uf', params.uf)
    if (params?.municipality) query.set('municipality', params.municipality)
    if (params?.prefeituraId) query.set('prefeituraId', params.prefeituraId)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return await apiFetch<AdminRecipientUbt[]>(`/admin/notificacoes/recipients/ubts${suffix}`, {
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchAdminRecipientProfissionaisStats(accessToken: string) {
  try {
    return await apiFetch<AdminRecipientProfissionaisStats>(
      '/admin/notificacoes/recipients/profissionais-stats',
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchAdminRecipientProfissionais(
  accessToken: string,
  params?: { search?: string; specialty?: string },
) {
  try {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.specialty) query.set('specialty', params.specialty)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return await apiFetch<AdminRecipientProfissional[]>(
      `/admin/notificacoes/recipients/profissionais${suffix}`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchAdminRecipientPrefeituraUsers(
  accessToken: string,
  params?: { uf?: string; municipality?: string; prefeituraId?: string; search?: string },
) {
  try {
    const query = new URLSearchParams()
    if (params?.uf) query.set('uf', params.uf)
    if (params?.municipality) query.set('municipality', params.municipality)
    if (params?.prefeituraId) query.set('prefeituraId', params.prefeituraId)
    if (params?.search) query.set('search', params.search)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return await apiFetch<AdminRecipientPrefeituraUser[]>(
      `/admin/notificacoes/recipients/prefeitura-users${suffix}`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchAdminRecipientUbtUsers(
  accessToken: string,
  params?: {
    uf?: string
    municipality?: string
    prefeituraId?: string
    unidadeId?: string
    search?: string
  },
) {
  try {
    const query = new URLSearchParams()
    if (params?.uf) query.set('uf', params.uf)
    if (params?.municipality) query.set('municipality', params.municipality)
    if (params?.prefeituraId) query.set('prefeituraId', params.prefeituraId)
    if (params?.unidadeId) query.set('unidadeId', params.unidadeId)
    if (params?.search) query.set('search', params.search)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return await apiFetch<AdminRecipientUbtUser[]>(
      `/admin/notificacoes/recipients/ubt-users${suffix}`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export type { AdminNotificationPriority, CreateAdminBroadcastPayload }

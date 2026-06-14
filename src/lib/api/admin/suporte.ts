import type {
  SupportMessage,
  SupportTicket,
  SupportTicketPriority,
  SupportTicketSource,
  SupportTicketStatus,
} from '../../../data/suporteMock'
import type {
  ListSupportTicketsParams,
  SupportKpisResponse,
  SupportTicketListResponse,
} from '../../mockServices/admin/suporte'
import { ApiError, apiFetch } from '../http'

export class AdminSuporteApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'AdminSuporteApiError'
  }
}

function mapApiError(error: unknown): AdminSuporteApiError {
  if (error instanceof ApiError) {
    return new AdminSuporteApiError(error.message, error.status, error.code)
  }
  return new AdminSuporteApiError('Não foi possível completar a requisição.', 0)
}

export function isAdminSuporteApiError(error: unknown): error is AdminSuporteApiError {
  return error instanceof AdminSuporteApiError
}

export async function fetchSupportKpis(accessToken: string) {
  try {
    return await apiFetch<SupportKpisResponse>('/admin/suporte/kpis', { accessToken })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchSupportTickets(accessToken: string, params: ListSupportTicketsParams = {}) {
  try {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.status) query.set('status', params.status)
    if (params.source) query.set('source', params.source)
    if (params.openOnly) query.set('openOnly', 'true')
    if (params.awaitingOnly) query.set('awaitingOnly', 'true')
    if (params.page) query.set('page', String(params.page))
    if (params.pageSize) query.set('pageSize', String(params.pageSize))
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return await apiFetch<SupportTicketListResponse>(`/admin/suporte/tickets${suffix}`, { accessToken })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchSupportTicket(accessToken: string, ticketId: string) {
  try {
    return await apiFetch<SupportTicket>(`/admin/suporte/tickets/${encodeURIComponent(ticketId)}`, {
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

function buildReplyFormData(body: string, files: File[] = []) {
  const form = new FormData()
  form.append('body', body)
  for (const file of files) {
    form.append('files', file, file.name)
  }
  return form
}

export async function sendSupportReply(
  accessToken: string,
  ticketId: string,
  body: string,
  files: File[] = [],
) {
  try {
    if (files.length) {
      return await apiFetch<SupportTicket>(
        `/admin/suporte/tickets/${encodeURIComponent(ticketId)}/replies`,
        {
          method: 'POST',
          accessToken,
          body: buildReplyFormData(body, files),
        },
      )
    }

    return await apiFetch<SupportTicket>(
      `/admin/suporte/tickets/${encodeURIComponent(ticketId)}/replies`,
      {
        method: 'POST',
        accessToken,
        json: { body },
      },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function updateSupportMessage(
  accessToken: string,
  ticketId: string,
  messageId: string,
  body: string,
) {
  try {
    return await apiFetch<SupportTicket>(
      `/admin/suporte/tickets/${encodeURIComponent(ticketId)}/messages/${encodeURIComponent(messageId)}`,
      {
        method: 'PATCH',
        accessToken,
        json: { body },
      },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function deleteSupportMessage(
  accessToken: string,
  ticketId: string,
  messageId: string,
) {
  try {
    return await apiFetch<SupportTicket>(
      `/admin/suporte/tickets/${encodeURIComponent(ticketId)}/messages/${encodeURIComponent(messageId)}`,
      {
        method: 'DELETE',
        accessToken,
      },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function closeSupportTicket(accessToken: string, ticketId: string) {
  try {
    return await apiFetch<SupportTicket>(
      `/admin/suporte/tickets/${encodeURIComponent(ticketId)}/close`,
      {
        method: 'POST',
        accessToken,
      },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export type {
  SupportMessage,
  SupportTicket,
  SupportTicketPriority,
  SupportTicketSource,
  SupportTicketStatus,
}

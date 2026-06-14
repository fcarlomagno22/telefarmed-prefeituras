import type { SupportTicket } from '../../../data/suporteMock'
import type {
  CreatePortalSupportTicketInput,
  ListPortalSupportTicketsParams,
  PortalSuporteVariant,
  PortalSupportTicketListResponse,
  SupportKpisResponse,
} from '../../mockServices/ubt/suporte'
import { ApiError, apiFetch } from '../http'

export class PortalSuporteApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PortalSuporteApiError'
  }
}

const VARIANT_PREFIX: Record<PortalSuporteVariant, string> = {
  ubt: '/ubt/suporte',
  prefeitura: '/prefeitura/suporte',
  profissional: '/profissional/suporte',
}

function mapApiError(error: unknown): PortalSuporteApiError {
  if (error instanceof ApiError) {
    return new PortalSuporteApiError(error.message, error.status, error.code)
  }
  return new PortalSuporteApiError('Não foi possível completar a requisição.', 0)
}

export function isPortalSuporteApiError(error: unknown): error is PortalSuporteApiError {
  return error instanceof PortalSuporteApiError
}

export function isUbtSuporteApiError(error: unknown): error is PortalSuporteApiError {
  return isPortalSuporteApiError(error)
}

function prefixFor(variant: PortalSuporteVariant) {
  return VARIANT_PREFIX[variant]
}

export async function fetchPortalSupportKpis(variant: PortalSuporteVariant, accessToken: string) {
  try {
    return await apiFetch<SupportKpisResponse>(`${prefixFor(variant)}/kpis`, { accessToken })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchPortalSupportTickets(
  variant: PortalSuporteVariant,
  accessToken: string,
  params: ListPortalSupportTicketsParams = {},
) {
  try {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.status) query.set('status', params.status)
    if (params.openOnly) query.set('openOnly', 'true')
    if (params.page) query.set('page', String(params.page))
    if (params.pageSize) query.set('pageSize', String(params.pageSize))
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return await apiFetch<PortalSupportTicketListResponse>(
      `${prefixFor(variant)}/tickets${suffix}`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchPortalSupportTicket(
  variant: PortalSuporteVariant,
  accessToken: string,
  ticketId: string,
) {
  try {
    return await apiFetch<SupportTicket>(
      `${prefixFor(variant)}/tickets/${encodeURIComponent(ticketId)}`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

function buildCreateFormData(input: CreatePortalSupportTicketInput) {
  const form = new FormData()
  form.append('subject', input.subject)
  form.append('category', input.category)
  if (input.priority) form.append('priority', input.priority)
  form.append('body', input.body)
  for (const file of input.files ?? []) {
    form.append('files', file, file.name)
  }
  return form
}

function buildReplyFormData(body: string, files: File[] = []) {
  const form = new FormData()
  form.append('body', body)
  for (const file of files) {
    form.append('files', file, file.name)
  }
  return form
}

export async function createPortalSupportTicket(
  variant: PortalSuporteVariant,
  accessToken: string,
  input: CreatePortalSupportTicketInput,
) {
  try {
    const hasFiles = Boolean(input.files?.length)
    return await apiFetch<SupportTicket>(`${prefixFor(variant)}/tickets`, {
      method: 'POST',
      accessToken,
      body: hasFiles ? buildCreateFormData(input) : undefined,
      json: hasFiles
        ? undefined
        : {
            subject: input.subject,
            category: input.category,
            priority: input.priority,
            body: input.body,
          },
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function sendPortalSupportReply(
  variant: PortalSuporteVariant,
  accessToken: string,
  ticketId: string,
  body: string,
  files: File[] = [],
) {
  try {
    if (files.length) {
      return await apiFetch<SupportTicket>(
        `${prefixFor(variant)}/tickets/${encodeURIComponent(ticketId)}/replies`,
        {
          method: 'POST',
          accessToken,
          body: buildReplyFormData(body, files),
        },
      )
    }

    return await apiFetch<SupportTicket>(
      `${prefixFor(variant)}/tickets/${encodeURIComponent(ticketId)}/replies`,
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

export async function updatePortalSupportMessage(
  variant: PortalSuporteVariant,
  accessToken: string,
  ticketId: string,
  messageId: string,
  body: string,
) {
  try {
    return await apiFetch<SupportTicket>(
      `${prefixFor(variant)}/tickets/${encodeURIComponent(ticketId)}/messages/${encodeURIComponent(messageId)}`,
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

export async function deletePortalSupportMessage(
  variant: PortalSuporteVariant,
  accessToken: string,
  ticketId: string,
  messageId: string,
) {
  try {
    return await apiFetch<SupportTicket>(
      `${prefixFor(variant)}/tickets/${encodeURIComponent(ticketId)}/messages/${encodeURIComponent(messageId)}`,
      {
        method: 'DELETE',
        accessToken,
      },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export type { PortalSuporteVariant }

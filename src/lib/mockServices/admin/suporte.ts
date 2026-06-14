import type {
  SupportMessage,
  SupportPrioritySlice,
  SupportTicket,
  SupportTicketPriority,
  SupportTicketSource,
  SupportTicketStatus,
} from '../../../data/suporteMock'
import {
  adminSupportAwaitingCount,
  adminSupportMonthlyTrend,
  adminSupportOpenCount,
  adminSupportPagination,
  adminSupportPriorityDistribution,
  adminSupportStatusSummary,
  adminSupportTickets,
} from '../../../data/adminSuporteMock'
import { mockDelay } from '../delay'

export class AdminSuporteApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminSuporteApiError'
    this.status = status
    this.code = code
  }
}

export type SupportKpisResponse = {
  awaitingCount: number
  unreadSupportMessagesCount?: number
  openCount: number
  total: number
  statusSummary: Array<{ key: SupportTicketStatus; label: string; count: number }>
  priorityDistribution: SupportPrioritySlice[]
  monthlyTrend: Array<{ label: string; count: number }>
}

export type SupportTicketListResponse = {
  tickets: SupportTicket[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ListSupportTicketsParams = {
  search?: string
  status?: SupportTicketStatus
  source?: SupportTicketSource
  openOnly?: boolean
  awaitingOnly?: boolean
  page?: number
  pageSize?: number
}

const ticketsState: SupportTicket[] = JSON.parse(JSON.stringify(adminSupportTickets))

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function ensureTicket(ticketId: string): SupportTicket {
  const ticket = ticketsState.find((item) => item.id === ticketId)
  if (!ticket) throw new AdminSuporteApiError('Chamado não encontrado.', 404)
  return ticket
}

function touchTicket(ticket: SupportTicket) {
  ticket.lastUpdate = new Date().toLocaleString('pt-BR')
}

export function isAdminSuporteApiError(error: unknown): error is AdminSuporteApiError {
  return error instanceof AdminSuporteApiError
}

export async function fetchSupportKpis(_accessToken: string): Promise<SupportKpisResponse> {
  void _accessToken
  return mockDelay(
    {
      awaitingCount: adminSupportAwaitingCount,
      unreadSupportMessagesCount: ticketsState.filter((ticket) => ticket.status === 'aguardando_resposta').length,
      openCount: adminSupportOpenCount,
      total: ticketsState.length,
      statusSummary: adminSupportStatusSummary.map((item) => ({
        key: item.key,
        label: item.label,
        count: ticketsState.filter((ticket) => ticket.status === item.key).length,
      })),
      priorityDistribution: adminSupportPriorityDistribution,
      monthlyTrend: adminSupportMonthlyTrend,
    },
    60,
  )
}

export async function fetchSupportTickets(
  _accessToken: string,
  params: ListSupportTicketsParams = {},
): Promise<SupportTicketListResponse> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? adminSupportPagination.pageSize
  const search = params.search?.trim().toLowerCase()
  const filtered = ticketsState.filter((ticket) => {
    if (params.status && ticket.status !== params.status) return false
    if (params.source && ticket.source !== params.source) return false
    if (params.openOnly && ticket.status === 'encerrado') return false
    if (params.awaitingOnly && ticket.status !== 'aguardando_resposta') return false
    if (
      search &&
      ![ticket.subject, ticket.category, ticket.number].some((value) => value.toLowerCase().includes(search))
    ) {
      return false
    }
    return true
  })
  const start = (page - 1) * pageSize
  return mockDelay(
    {
      tickets: clone(filtered.slice(start, start + pageSize)),
      page,
      pageSize,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    },
    60,
  )
}

export async function fetchSupportTicket(
  _accessToken: string,
  ticketId: string,
): Promise<SupportTicket> {
  return mockDelay(clone(ensureTicket(ticketId)), 50)
}

export async function sendSupportReply(
  _accessToken: string,
  ticketId: string,
  body: string,
  _files: File[] = [],
): Promise<SupportTicket> {
  void _accessToken
  void _files
  const ticket = ensureTicket(ticketId)
  const message: SupportMessage = {
    id: `msg-${Date.now()}`,
    author: 'support',
    authorName: 'Suporte Telefarmed',
    body,
    sentAt: new Date().toLocaleString('pt-BR'),
  }
  ticket.messages.push(message)
  ticket.status = 'respondido'
  touchTicket(ticket)
  return mockDelay(clone(ticket), 70)
}

export async function updateSupportMessage(
  _accessToken: string,
  ticketId: string,
  messageId: string,
  body: string,
): Promise<SupportTicket> {
  const ticket = ensureTicket(ticketId)
  const message = ticket.messages.find((item) => item.id === messageId)
  if (!message) throw new AdminSuporteApiError('Mensagem não encontrada.', 404)
  message.body = body
  message.editedAt = new Date().toLocaleString('pt-BR')
  touchTicket(ticket)
  return mockDelay(clone(ticket), 70)
}

export async function deleteSupportMessage(
  _accessToken: string,
  ticketId: string,
  messageId: string,
): Promise<SupportTicket> {
  const ticket = ensureTicket(ticketId)
  const message = ticket.messages.find((item) => item.id === messageId)
  if (!message) throw new AdminSuporteApiError('Mensagem não encontrada.', 404)
  message.deleted = true
  message.deletedSnapshot = {
    body: message.body,
    editedAt: message.editedAt,
    attachments: message.attachments,
  }
  message.body = '[mensagem removida]'
  touchTicket(ticket)
  return mockDelay(clone(ticket), 70)
}

export async function closeSupportTicket(
  _accessToken: string,
  ticketId: string,
): Promise<SupportTicket> {
  const ticket = ensureTicket(ticketId)
  ticket.status = 'encerrado'
  touchTicket(ticket)
  return mockDelay(clone(ticket), 60)
}

export type { SupportMessage, SupportTicket, SupportTicketPriority, SupportTicketSource, SupportTicketStatus }

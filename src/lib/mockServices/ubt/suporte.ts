import type {
  SupportMessage,
  SupportPrioritySlice,
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../../../data/suporteMock'
import {
  supportMonthlyTrend,
  supportPriorityDistribution,
  supportStatusSummary,
  supportTicketCategories,
  supportTickets,
} from '../../../data/suporteMock'
import { mockDelay } from '../delay'

export type PortalSuporteVariant = 'prefeitura' | 'ubt' | 'profissional'

export type SupportKpisResponse = {
  awaitingCount: number
  unreadSupportMessagesCount?: number
  openCount: number
  total: number
  statusSummary: Array<{ key: SupportTicketStatus; label: string; count: number }>
  priorityDistribution: SupportPrioritySlice[]
  monthlyTrend: Array<{ label: string; count: number }>
}

export class UbtSuporteApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'UbtSuporteApiError'
    this.status = status
    this.code = code
  }
}

export type PortalSupportTicketListResponse = {
  tickets: SupportTicket[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ListPortalSupportTicketsParams = {
  search?: string
  status?: SupportTicketStatus
  openOnly?: boolean
  page?: number
  pageSize?: number
}

export type CreatePortalSupportTicketInput = {
  subject: string
  category: string
  priority?: SupportTicketPriority
  body: string
  files?: File[]
}

const VARIANT_TICKET_DEFAULTS: Record<
  PortalSuporteVariant,
  Pick<SupportTicket, 'source' | 'municipalityName' | 'openedByName' | 'openedByRole'> &
    Partial<Pick<SupportTicket, 'ubtId' | 'ubtName'>>
> = {
  ubt: {
    source: 'ubt',
    municipalityName: 'Municipio demo',
    ubtId: 'ubt_centro',
    ubtName: 'UBT Centro',
    openedByName: 'Operador UBT',
    openedByRole: 'Operador',
  },
  prefeitura: {
    source: 'prefeitura',
    municipalityName: 'Prefeitura demo',
    openedByName: 'Gestor municipal',
    openedByRole: 'Prefeitura',
  },
  profissional: {
    source: 'profissional',
    municipalityName: 'Municipio demo',
    openedByName: 'Dr. Demo',
    openedByRole: 'Medico',
  },
}

function seedTicketsForVariant(variant: PortalSuporteVariant): SupportTicket[] {
  const defaults = VARIANT_TICKET_DEFAULTS[variant]
  return structuredClone(
    supportTickets.map((ticket) => ({
      ...ticket,
      ...defaults,
    })),
  )
}

const ticketsState: Record<PortalSuporteVariant, SupportTicket[]> = {
  ubt: seedTicketsForVariant('ubt'),
  prefeitura: seedTicketsForVariant('prefeitura'),
  profissional: seedTicketsForVariant('profissional'),
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function getTicketsForVariant(variant: PortalSuporteVariant) {
  return ticketsState[variant]
}

function isOpenStatus(status: SupportTicketStatus) {
  return status !== 'encerrado'
}

function findTicket(variant: PortalSuporteVariant, ticketId: string): SupportTicket {
  const ticket = getTicketsForVariant(variant).find((item) => item.id === ticketId)
  if (!ticket) throw new UbtSuporteApiError('Chamado nao encontrado.', 404, 'TICKET_NOT_FOUND')
  return ticket
}

function computeUnreadSupportMessages(variant: PortalSuporteVariant) {
  return getTicketsForVariant(variant).reduce(
    (acc, ticket) => acc + ticket.messages.filter((message) => message.author === 'support').length,
    0,
  )
}

function buildKpis(variant: PortalSuporteVariant): SupportKpisResponse {
  const tickets = getTicketsForVariant(variant)
  const awaitingCount = tickets.filter((ticket) => ticket.status === 'aguardando_resposta').length
  const openCount = tickets.filter((ticket) => isOpenStatus(ticket.status)).length
  const summary = supportStatusSummary.map((item) => ({
    key: item.key,
    label: item.label,
    count: tickets.filter((ticket) => ticket.status === item.key).length,
  }))
  return {
    awaitingCount,
    unreadSupportMessagesCount: computeUnreadSupportMessages(variant),
    openCount,
    total: tickets.length,
    statusSummary: summary,
    priorityDistribution: supportPriorityDistribution,
    monthlyTrend: supportMonthlyTrend,
  }
}

function listTickets(
  variant: PortalSuporteVariant,
  params: ListPortalSupportTicketsParams = {},
): PortalSupportTicketListResponse {
  let items = [...getTicketsForVariant(variant)].sort((a, b) => (a.lastUpdate < b.lastUpdate ? 1 : -1))
  if (params.search?.trim()) {
    const needle = params.search.trim().toLowerCase()
    items = items.filter((item) =>
      [item.subject, item.number, item.category, item.openedByName ?? ''].join(' ').toLowerCase().includes(needle),
    )
  }
  if (params.status) {
    items = items.filter((item) => item.status === params.status)
  }
  if (params.openOnly) {
    items = items.filter((item) => isOpenStatus(item.status))
  }
  const page = params.page && params.page > 0 ? params.page : 1
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  return {
    tickets: clone(items.slice(start, start + pageSize)),
    page,
    pageSize,
    total,
    totalPages,
  }
}

function nowLabel() {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

export const PortalSuporteApiError = UbtSuporteApiError

export function isPortalSuporteApiError(error: unknown): error is UbtSuporteApiError {
  return isUbtSuporteApiError(error)
}

export function isUbtSuporteApiError(error: unknown): error is UbtSuporteApiError {
  return error instanceof UbtSuporteApiError
}

export async function fetchPortalSupportKpis(
  variant: PortalSuporteVariant,
  _accessToken: string,
): Promise<SupportKpisResponse> {
  void _accessToken
  return mockDelay(buildKpis(variant))
}

export async function fetchPortalSupportTickets(
  variant: PortalSuporteVariant,
  _accessToken: string,
  params: ListPortalSupportTicketsParams = {},
): Promise<PortalSupportTicketListResponse> {
  void _accessToken
  return mockDelay(listTickets(variant, params))
}

export async function fetchPortalSupportTicket(
  variant: PortalSuporteVariant,
  _accessToken: string,
  ticketId: string,
): Promise<SupportTicket> {
  void _accessToken
  return mockDelay(clone(findTicket(variant, ticketId)))
}

export async function createPortalSupportTicket(
  variant: PortalSuporteVariant,
  _accessToken: string,
  input: CreatePortalSupportTicketInput,
): Promise<SupportTicket> {
  void _accessToken
  const defaults = VARIANT_TICKET_DEFAULTS[variant]
  const now = nowLabel()
  const created: SupportTicket = {
    id: `mock-ticket-${Date.now()}`,
    number: `#CH-${Math.floor(1000 + Math.random() * 9000)}`,
    subject: input.subject,
    status: 'em_andamento',
    priority: input.priority ?? 'media',
    lastUpdate: now,
    openedAt: now,
    category: supportTicketCategories.includes(input.category as never) ? input.category : 'Outros',
    ...defaults,
    messages: [
      {
        id: `msg-${Date.now()}`,
        author: 'operator',
        authorName: defaults.openedByName ?? 'Usuario',
        body: input.body,
        sentAt: now,
      },
    ],
  }
  getTicketsForVariant(variant).unshift(created)
  return mockDelay(clone(created))
}

export async function sendPortalSupportReply(
  variant: PortalSuporteVariant,
  _accessToken: string,
  ticketId: string,
  body: string,
  _files: File[] = [],
): Promise<SupportTicket> {
  void _accessToken
  void _files
  const ticket = findTicket(variant, ticketId)
  const defaults = VARIANT_TICKET_DEFAULTS[variant]
  const message: SupportMessage = {
    id: `msg-${Date.now()}`,
    author: 'operator',
    authorName: defaults.openedByName ?? 'Usuario',
    body,
    sentAt: nowLabel(),
  }
  ticket.messages.push(message)
  ticket.status = 'respondido'
  ticket.lastUpdate = nowLabel()
  return mockDelay(clone(ticket))
}

export async function updatePortalSupportMessage(
  variant: PortalSuporteVariant,
  _accessToken: string,
  ticketId: string,
  messageId: string,
  body: string,
): Promise<SupportTicket> {
  void _accessToken
  const ticket = findTicket(variant, ticketId)
  const message = ticket.messages.find((item) => item.id === messageId)
  if (!message) {
    throw new UbtSuporteApiError('Mensagem nao encontrada.', 404, 'MESSAGE_NOT_FOUND')
  }
  message.body = body
  message.editedAt = nowLabel()
  ticket.lastUpdate = nowLabel()
  return mockDelay(clone(ticket))
}

export async function deletePortalSupportMessage(
  variant: PortalSuporteVariant,
  _accessToken: string,
  ticketId: string,
  messageId: string,
): Promise<SupportTicket> {
  void _accessToken
  const ticket = findTicket(variant, ticketId)
  const message = ticket.messages.find((item) => item.id === messageId)
  if (!message) {
    throw new UbtSuporteApiError('Mensagem nao encontrada.', 404, 'MESSAGE_NOT_FOUND')
  }
  message.deleted = true
  message.deletedSnapshot = {
    body: message.body,
    editedAt: message.editedAt,
    attachments: message.attachments,
  }
  message.body = 'Mensagem removida pelo operador.'
  message.editedAt = nowLabel()
  ticket.lastUpdate = nowLabel()
  return mockDelay(clone(ticket))
}

export type { SupportMessage, SupportTicket }

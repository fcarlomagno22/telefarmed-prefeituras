import { z } from 'zod'
import { MAX_SUPORTE_BODY_LENGTH, SUPPORT_TICKET_CATEGORIES } from './constants.js'

const ticketStatusSchema = z.enum([
  'em_andamento',
  'aguardando_resposta',
  'respondido',
  'encerrado',
])

const ticketSourceSchema = z.enum(['ubt', 'prefeitura', 'profissional'])

const ticketPrioritySchema = z.enum(['alta', 'media', 'baixa'])

export const listTicketsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: ticketStatusSchema.optional(),
  source: ticketSourceSchema.optional(),
  openOnly: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((value) => value === true || value === 'true'),
  awaitingOnly: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((value) => value === true || value === 'true'),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
})

export const listPortalTicketsQuerySchema = listTicketsQuerySchema.omit({
  source: true,
  awaitingOnly: true,
})

export const ticketIdParamSchema = z.object({
  ticketId: z.string().uuid('Identificador inválido.'),
})

export const messageIdParamSchema = ticketIdParamSchema.extend({
  messageId: z.string().uuid('Identificador inválido.'),
})

export const createTicketBodySchema = z.object({
  subject: z.string().trim().min(3).max(200),
  category: z.enum(SUPPORT_TICKET_CATEGORIES),
  priority: ticketPrioritySchema.optional(),
  body: z.string().trim().min(1).max(MAX_SUPORTE_BODY_LENGTH),
})

export const replyBodySchema = z.object({
  body: z.string().trim().min(1).max(MAX_SUPORTE_BODY_LENGTH),
})

export const editMessageBodySchema = z.object({
  body: z.string().trim().min(1).max(MAX_SUPORTE_BODY_LENGTH),
})

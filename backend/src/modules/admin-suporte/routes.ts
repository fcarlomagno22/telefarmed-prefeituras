import multipart from '@fastify/multipart'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { requireAdminAuth, requireAdminPagePermission } from '../admin-auth/middleware.js'
import { closeAdminSupportTicket } from '../suporte/close.service.js'
import { getAdminSupportTicket } from '../suporte/detail.service.js'
import { formatSuporteValidationError, mapSuporteError } from '../suporte/errors.js'
import { getAdminSupportKpis } from '../suporte/kpis.service.js'
import { listAdminSupportTickets } from '../suporte/list.service.js'
import {
  deleteAdminSupportMessage,
  updateAdminSupportMessage,
} from '../suporte/messages.service.js'
import { parseSuporteMultipart } from '../suporte/multipart.js'
import { sendAdminSupportReply } from '../suporte/reply.service.js'
import {
  editMessageBodySchema,
  listTicketsQuerySchema,
  messageIdParamSchema,
  replyBodySchema,
  ticketIdParamSchema,
} from '../suporte/schemas.js'
import { MAX_SUPORTE_ANEXO_BYTES, MAX_SUPORTE_ANEXOS_PER_MESSAGE } from '../suporte/constants.js'

const canView = requireAdminPagePermission('suporte', 'visualizar')
const canInsert = requireAdminPagePermission('suporte', 'inserir')
const canEdit = requireAdminPagePermission('suporte', 'editar')
const canDelete = requireAdminPagePermission('suporte', 'excluir')

function adminActor(request: FastifyRequest) {
  const admin = request.admin!
  return { id: admin.id, nome: admin.nome }
}

export async function registerAdminSuporteRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdminAuth)

  await app.register(multipart, {
    limits: {
      fileSize: MAX_SUPORTE_ANEXO_BYTES,
      files: MAX_SUPORTE_ANEXOS_PER_MESSAGE,
      fields: 8,
      parts: 12,
    },
  })

  app.get('/kpis', { preHandler: canView }, async (_request, reply) => {
    try {
      const kpis = await getAdminSupportKpis()
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send(kpis)
    } catch (error) {
      const mapped = mapSuporteError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/tickets', { preHandler: canView }, async (request, reply) => {
    const parsed = listTicketsQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatSuporteValidationError(parsed.error) })
    }

    try {
      const result = await listAdminSupportTickets(parsed.data)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(result)
    } catch (error) {
      const mapped = mapSuporteError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/tickets/:ticketId', { preHandler: canView }, async (request, reply) => {
    const parsed = ticketIdParamSchema.safeParse(request.params ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatSuporteValidationError(parsed.error) })
    }

    try {
      const ticket = await getAdminSupportTicket(parsed.data.ticketId)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(ticket)
    } catch (error) {
      const mapped = mapSuporteError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/tickets/:ticketId/replies', { preHandler: canInsert }, async (request, reply) => {
    const params = ticketIdParamSchema.safeParse(request.params ?? {})
    if (!params.success) {
      return reply.status(400).send({ error: formatSuporteValidationError(params.error) })
    }

    try {
      let body = ''
      let files: Awaited<ReturnType<typeof parseSuporteMultipart>>['files'] = []

      if (request.isMultipart()) {
        const parsed = await parseSuporteMultipart(request)
        body = parsed.fields.body ?? ''
        files = parsed.files
      } else {
        const parsedBody = replyBodySchema.safeParse(request.body ?? {})
        if (!parsedBody.success) {
          return reply.status(400).send({ error: formatSuporteValidationError(parsedBody.error) })
        }
        body = parsedBody.data.body
      }

      const validated = replyBodySchema.safeParse({ body })
      if (!validated.success) {
        return reply.status(400).send({ error: formatSuporteValidationError(validated.error) })
      }

      const ticket = await sendAdminSupportReply(
        adminActor(request),
        params.data.ticketId,
        validated.data.body,
        files,
      )
      return reply.send(ticket)
    } catch (error) {
      const mapped = mapSuporteError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/tickets/:ticketId/messages/:messageId', { preHandler: canEdit }, async (request, reply) => {
    const params = messageIdParamSchema.safeParse(request.params ?? {})
    if (!params.success) {
      return reply.status(400).send({ error: formatSuporteValidationError(params.error) })
    }

    const parsed = editMessageBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatSuporteValidationError(parsed.error) })
    }

    try {
      const ticket = await updateAdminSupportMessage(
        adminActor(request),
        params.data.ticketId,
        params.data.messageId,
        parsed.data.body,
      )
      return reply.send(ticket)
    } catch (error) {
      const mapped = mapSuporteError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/tickets/:ticketId/messages/:messageId', { preHandler: canDelete }, async (request, reply) => {
    const params = messageIdParamSchema.safeParse(request.params ?? {})
    if (!params.success) {
      return reply.status(400).send({ error: formatSuporteValidationError(params.error) })
    }

    try {
      const ticket = await deleteAdminSupportMessage(
        adminActor(request),
        params.data.ticketId,
        params.data.messageId,
      )
      return reply.send(ticket)
    } catch (error) {
      const mapped = mapSuporteError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/tickets/:ticketId/close', { preHandler: canEdit }, async (request, reply) => {
    const params = ticketIdParamSchema.safeParse(request.params ?? {})
    if (!params.success) {
      return reply.status(400).send({ error: formatSuporteValidationError(params.error) })
    }

    try {
      const ticket = await closeAdminSupportTicket(adminActor(request), params.data.ticketId)
      return reply.send(ticket)
    } catch (error) {
      const mapped = mapSuporteError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

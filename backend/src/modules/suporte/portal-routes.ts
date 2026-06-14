import multipart from '@fastify/multipart'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { createPortalSupportTicket } from '../suporte/create.service.js'
import { getPortalSupportTicket } from '../suporte/detail.service.js'
import { formatSuporteValidationError, mapSuporteError } from '../suporte/errors.js'
import { getPortalSupportKpis } from '../suporte/kpis.service.js'
import { listPortalSupportTickets } from '../suporte/list.service.js'
import {
  deletePortalSupportMessage,
  updatePortalSupportMessage,
} from '../suporte/messages.service.js'
import { parseSuporteMultipart } from '../suporte/multipart.js'
import { sendPortalSupportReply } from '../suporte/reply.service.js'
import {
  createTicketBodySchema,
  editMessageBodySchema,
  listPortalTicketsQuerySchema,
  messageIdParamSchema,
  replyBodySchema,
  ticketIdParamSchema,
} from '../suporte/schemas.js'
import { MAX_SUPORTE_ANEXO_BYTES, MAX_SUPORTE_ANEXOS_PER_MESSAGE } from '../suporte/constants.js'
import type { PortalActor, PortalSuporteVariant } from '../suporte/types.js'

type PortalRouteConfig = {
  variant: PortalSuporteVariant
  requireAuth: (request: FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>
  canView: (request: FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>
  canInsert: (request: FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>
  canEdit: (request: FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>
  canDelete: (request: FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>
  actorFromRequest: (request: FastifyRequest) => PortalActor
}

export async function registerPortalSuporteRoutes(
  app: FastifyInstance,
  config: PortalRouteConfig,
): Promise<void> {
  app.addHook('preHandler', config.requireAuth)

  await app.register(async (scoped) => {
    await scoped.register(multipart, {
      limits: {
        fileSize: MAX_SUPORTE_ANEXO_BYTES,
        files: MAX_SUPORTE_ANEXOS_PER_MESSAGE,
        fields: 12,
        parts: 16,
      },
    })

    scoped.get('/kpis', { preHandler: config.canView }, async (request, reply) => {
      try {
        const kpis = await getPortalSupportKpis(config.actorFromRequest(request))
        reply.header('Cache-Control', 'private, max-age=30')
        return reply.send(kpis)
      } catch (error) {
        const mapped = mapSuporteError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    })

    scoped.get('/tickets', { preHandler: config.canView }, async (request, reply) => {
      const parsed = listPortalTicketsQuerySchema.safeParse(request.query ?? {})
      if (!parsed.success) {
        return reply.status(400).send({ error: formatSuporteValidationError(parsed.error) })
      }

      try {
        const result = await listPortalSupportTickets(config.actorFromRequest(request), parsed.data)
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(result)
      } catch (error) {
        const mapped = mapSuporteError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    })

    scoped.get('/tickets/:ticketId', { preHandler: config.canView }, async (request, reply) => {
      const parsed = ticketIdParamSchema.safeParse(request.params ?? {})
      if (!parsed.success) {
        return reply.status(400).send({ error: formatSuporteValidationError(parsed.error) })
      }

      try {
        const ticket = await getPortalSupportTicket(
          config.actorFromRequest(request),
          parsed.data.ticketId,
        )
        reply.header('Cache-Control', 'private, no-store')
        return reply.send(ticket)
      } catch (error) {
        const mapped = mapSuporteError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    })

    scoped.post('/tickets', { preHandler: config.canInsert }, async (request, reply) => {
      try {
        let input: import('zod').infer<typeof createTicketBodySchema>
        let files: Awaited<ReturnType<typeof parseSuporteMultipart>>['files'] = []

        if (request.isMultipart()) {
          const parsed = await parseSuporteMultipart(request)
          const validated = createTicketBodySchema.safeParse({
            subject: parsed.fields.subject,
            category: parsed.fields.category,
            priority: parsed.fields.priority || undefined,
            body: parsed.fields.body,
          })
          if (!validated.success) {
            return reply.status(400).send({ error: formatSuporteValidationError(validated.error) })
          }
          input = validated.data
          files = parsed.files
        } else {
          const validated = createTicketBodySchema.safeParse(request.body ?? {})
          if (!validated.success) {
            return reply.status(400).send({ error: formatSuporteValidationError(validated.error) })
          }
          input = validated.data
        }

        const ticket = await createPortalSupportTicket(config.actorFromRequest(request), input, files)
        return reply.status(201).send(ticket)
      } catch (error) {
        const mapped = mapSuporteError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    })

    scoped.post('/tickets/:ticketId/replies', { preHandler: config.canInsert }, async (request, reply) => {
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

        const ticket = await sendPortalSupportReply(
          config.actorFromRequest(request),
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

    scoped.patch('/tickets/:ticketId/messages/:messageId', { preHandler: config.canEdit }, async (request, reply) => {
      const params = messageIdParamSchema.safeParse(request.params ?? {})
      if (!params.success) {
        return reply.status(400).send({ error: formatSuporteValidationError(params.error) })
      }

      const parsed = editMessageBodySchema.safeParse(request.body ?? {})
      if (!parsed.success) {
        return reply.status(400).send({ error: formatSuporteValidationError(parsed.error) })
      }

      try {
        const ticket = await updatePortalSupportMessage(
          config.actorFromRequest(request),
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

    scoped.delete('/tickets/:ticketId/messages/:messageId', { preHandler: config.canDelete }, async (request, reply) => {
      const params = messageIdParamSchema.safeParse(request.params ?? {})
      if (!params.success) {
        return reply.status(400).send({ error: formatSuporteValidationError(params.error) })
      }

      try {
        const ticket = await deletePortalSupportMessage(
          config.actorFromRequest(request),
          params.data.ticketId,
          params.data.messageId,
        )
        return reply.send(ticket)
      } catch (error) {
        const mapped = mapSuporteError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    })
  })
}

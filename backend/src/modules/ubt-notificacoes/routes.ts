import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  requireUbtAuth,
  requireUbtPagePermission,
} from '../ubt-auth/middleware.js'
import {
  getPortalNotificationKpis,
  listPortalNotifications,
  markAllPortalNotificationsRead,
  markPortalNotificationRead,
} from '../comunicados/inbox.service.js'
import { listUbtProfissionaisCatalog } from './catalog.service.js'
import { createUbtBroadcast } from './create.service.js'
import { formatUbtNotificacoesValidationError, mapUbtNotificacoesError } from './errors.js'
import {
  createUbtBroadcastSchema,
  listNotificationsQuerySchema,
  ubtProfissionaisCatalogQuerySchema,
} from './schemas.js'

const canView = requireUbtPagePermission('notificacoes', 'visualizar')
const canSend = requireUbtPagePermission('notificacoes', 'inserir')

function userContext(request: FastifyRequest) {
  const user = request.ubtUser!
  return {
    userId: user.id,
    entidadeId: user.entidadeContratanteId,
    unitId: user.unidadeUbtId,
    nome: user.nome,
  }
}

export async function registerUbtNotificacoesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUbtAuth)

  app.get('/kpis', { preHandler: canView }, async (request, reply) => {
    try {
      const ctx = userContext(request)
      const kpis = await getPortalNotificationKpis('ubt', ctx.userId, {
        entidadeId: ctx.entidadeId,
        unitId: ctx.unitId,
      })
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send(kpis)
    } catch (error) {
      const mapped = mapUbtNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/', { preHandler: canView }, async (request, reply) => {
    const parsed = listNotificationsQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatUbtNotificacoesValidationError(parsed.error) })
    }

    try {
      const ctx = userContext(request)
      const result = await listPortalNotifications('ubt', ctx.userId, {
        entidadeId: ctx.entidadeId,
        unitId: ctx.unitId,
      }, parsed.data)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(result)
    } catch (error) {
      const mapped = mapUbtNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/recipients/profissionais', { preHandler: canView }, async (request, reply) => {
    const parsed = ubtProfissionaisCatalogQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatUbtNotificacoesValidationError(parsed.error) })
    }

    try {
      const ctx = userContext(request)
      const profissionais = await listUbtProfissionaisCatalog(
        ctx.entidadeId,
        ctx.unitId,
        parsed.data,
      )
      reply.header('Cache-Control', 'private, max-age=60')
      return reply.send({ profissionais })
    } catch (error) {
      const mapped = mapUbtNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/broadcasts', { preHandler: canSend }, async (request, reply) => {
    const parsed = createUbtBroadcastSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatUbtNotificacoesValidationError(parsed.error) })
    }

    try {
      const ctx = userContext(request)
      const result = await createUbtBroadcast(
        { entidadeId: ctx.entidadeId, unitId: ctx.unitId, sender: { id: ctx.userId, nome: ctx.nome } },
        parsed.data,
      )
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapUbtNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/:comunicadoId/read', { preHandler: canView }, async (request, reply) => {
    const comunicadoId = (request.params as { comunicadoId?: string }).comunicadoId
    if (!comunicadoId) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    try {
      await markPortalNotificationRead('ubt', userContext(request).userId, comunicadoId)
      return reply.send({ ok: true })
    } catch (error) {
      const mapped = mapUbtNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/read-all', { preHandler: canView }, async (request, reply) => {
    try {
      const count = await markAllPortalNotificationsRead('ubt', userContext(request).userId)
      return reply.send({ count })
    } catch (error) {
      const mapped = mapUbtNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

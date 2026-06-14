import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  requirePrefeituraAuth,
  requirePrefeituraPagePermission,
} from '../prefeitura-auth/middleware.js'
import {
  getPortalNotificationKpis,
  listPortalNotifications,
  markAllPortalNotificationsRead,
  markPortalNotificationRead,
} from '../comunicados/inbox.service.js'
import {
  listPrefeituraProfissionaisCatalog,
  listPrefeituraUbtBroadcastCatalog,
} from './catalog.service.js'
import { createPrefeituraBroadcast } from './create.service.js'
import {
  formatPrefeituraNotificacoesValidationError,
  mapPrefeituraNotificacoesError,
} from './errors.js'
import {
  createPrefeituraBroadcastSchema,
  listNotificationsQuerySchema,
  prefeituraProfissionaisCatalogQuerySchema,
} from './schemas.js'

const canView = requirePrefeituraPagePermission('notificacoes', 'visualizar')
const canSend = requirePrefeituraPagePermission('notificacoes', 'inserir')

function userContext(request: FastifyRequest) {
  const user = request.prefeituraUser!
  return { userId: user.id, entidadeId: user.entidadeContratanteId, nome: user.nome }
}

export async function registerPrefeituraNotificacoesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requirePrefeituraAuth)

  app.get('/kpis', { preHandler: canView }, async (request, reply) => {
    try {
      const ctx = userContext(request)
      const kpis = await getPortalNotificationKpis('prefeitura', ctx.userId, {
        entidadeId: ctx.entidadeId,
      })
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send(kpis)
    } catch (error) {
      const mapped = mapPrefeituraNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/', { preHandler: canView }, async (request, reply) => {
    const parsed = listNotificationsQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatPrefeituraNotificacoesValidationError(parsed.error) })
    }

    try {
      const ctx = userContext(request)
      const result = await listPortalNotifications('prefeitura', ctx.userId, {
        entidadeId: ctx.entidadeId,
      }, parsed.data)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(result)
    } catch (error) {
      const mapped = mapPrefeituraNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/recipients/ubt', { preHandler: canView }, async (request, reply) => {
    try {
      const ctx = userContext(request)
      const catalog = await listPrefeituraUbtBroadcastCatalog(ctx.entidadeId)
      reply.header('Cache-Control', 'private, max-age=60')
      return reply.send(catalog)
    } catch (error) {
      const mapped = mapPrefeituraNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/recipients/profissionais', { preHandler: canView }, async (request, reply) => {
    const parsed = prefeituraProfissionaisCatalogQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatPrefeituraNotificacoesValidationError(parsed.error) })
    }

    try {
      const ctx = userContext(request)
      const profissionais = await listPrefeituraProfissionaisCatalog(ctx.entidadeId, parsed.data)
      reply.header('Cache-Control', 'private, max-age=60')
      return reply.send({ profissionais })
    } catch (error) {
      const mapped = mapPrefeituraNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/broadcasts', { preHandler: canSend }, async (request, reply) => {
    const parsed = createPrefeituraBroadcastSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatPrefeituraNotificacoesValidationError(parsed.error) })
    }

    try {
      const ctx = userContext(request)
      const result = await createPrefeituraBroadcast(ctx.entidadeId, { id: ctx.userId, nome: ctx.nome }, parsed.data)
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapPrefeituraNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/:comunicadoId/read', { preHandler: canView }, async (request, reply) => {
    const comunicadoId = (request.params as { comunicadoId?: string }).comunicadoId
    if (!comunicadoId) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    try {
      await markPortalNotificationRead('prefeitura', userContext(request).userId, comunicadoId)
      return reply.send({ ok: true })
    } catch (error) {
      const mapped = mapPrefeituraNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/read-all', { preHandler: canView }, async (request, reply) => {
    try {
      const count = await markAllPortalNotificationsRead('prefeitura', userContext(request).userId)
      return reply.send({ count })
    } catch (error) {
      const mapped = mapPrefeituraNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

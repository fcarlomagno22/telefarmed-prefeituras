import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  requireProfissionalAuth,
  requireProfissionalPagePermission,
} from '../profissional-auth/middleware.js'
import {
  getPortalNotificationKpis,
  listPortalNotifications,
  markAllPortalNotificationsRead,
  markPortalNotificationRead,
} from '../comunicados/inbox.service.js'
import {
  formatProfissionalNotificacoesValidationError,
  mapProfissionalNotificacoesError,
} from './errors.js'
import { listNotificationsQuerySchema } from './schemas.js'

const canView = requireProfissionalPagePermission('notificacoes', 'visualizar')

function profissionalId(request: FastifyRequest) {
  return request.profissionalUser!.id
}

export async function registerProfissionalNotificacoesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireProfissionalAuth)

  app.get('/kpis', { preHandler: canView }, async (request, reply) => {
    try {
      const kpis = await getPortalNotificationKpis('profissional', profissionalId(request), {})
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send(kpis)
    } catch (error) {
      const mapped = mapProfissionalNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/', { preHandler: canView }, async (request, reply) => {
    const parsed = listNotificationsQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatProfissionalNotificacoesValidationError(parsed.error) })
    }

    try {
      const result = await listPortalNotifications(
        'profissional',
        profissionalId(request),
        {},
        { ...parsed.data, direction: 'inbox' },
      )
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(result)
    } catch (error) {
      const mapped = mapProfissionalNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/:comunicadoId/read', { preHandler: canView }, async (request, reply) => {
    const comunicadoId = (request.params as { comunicadoId?: string }).comunicadoId
    if (!comunicadoId) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    try {
      await markPortalNotificationRead('profissional', profissionalId(request), comunicadoId)
      return reply.send({ ok: true })
    } catch (error) {
      const mapped = mapProfissionalNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/read-all', { preHandler: canView }, async (request, reply) => {
    try {
      const count = await markAllPortalNotificationsRead('profissional', profissionalId(request))
      return reply.send({ count })
    } catch (error) {
      const mapped = mapProfissionalNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

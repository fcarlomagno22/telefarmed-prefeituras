import type { FastifyInstance, FastifyRequest } from 'fastify'
import { requireAdminAuth, requireAdminPagePermission } from '../admin-auth/middleware.js'
import {
  formatAdminNotificacoesValidationError,
  mapAdminNotificacoesError,
} from './errors.js'
import { createAdminBroadcast } from './create.service.js'
import { getAdminNotificationKpis, listAdminBroadcasts } from './list.service.js'
import {
  getAdminRecipientProfissionaisStats,
  listAdminRecipientPrefeituraUsers,
  listAdminRecipientPrefeituras,
  listAdminRecipientProfissionais,
  listAdminRecipientUbtUsers,
  listAdminRecipientUbts,
} from './recipients.service.js'
import {
  createAdminBroadcastSchema,
  listBroadcastsQuerySchema,
  recipientCatalogQuerySchema,
} from './schemas.js'

const canView = requireAdminPagePermission('notificacoes', 'visualizar')
const canSend = requireAdminPagePermission('notificacoes', 'inserir')

function adminUser(request: FastifyRequest) {
  return request.admin!
}

export async function registerAdminNotificacoesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdminAuth)

  app.get('/kpis', { preHandler: canView }, async (_request, reply) => {
    try {
      const kpis = await getAdminNotificationKpis()
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send(kpis)
    } catch (error) {
      const mapped = mapAdminNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/broadcasts', { preHandler: canView }, async (request, reply) => {
    const parsed = listBroadcastsQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatAdminNotificacoesValidationError(parsed.error) })
    }

    try {
      const result = await listAdminBroadcasts(parsed.data)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(result)
    } catch (error) {
      const mapped = mapAdminNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/broadcasts', { preHandler: canSend }, async (request, reply) => {
    const parsed = createAdminBroadcastSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatAdminNotificacoesValidationError(parsed.error) })
    }

    try {
      const broadcast = await createAdminBroadcast(adminUser(request), parsed.data)
      return reply.status(201).send(broadcast)
    } catch (error) {
      const mapped = mapAdminNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/recipients/prefeituras', { preHandler: canView }, async (request, reply) => {
    const parsed = recipientCatalogQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatAdminNotificacoesValidationError(parsed.error) })
    }

    try {
      return reply.send(await listAdminRecipientPrefeituras(parsed.data))
    } catch (error) {
      const mapped = mapAdminNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/recipients/ubts', { preHandler: canView }, async (request, reply) => {
    const parsed = recipientCatalogQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatAdminNotificacoesValidationError(parsed.error) })
    }

    try {
      return reply.send(await listAdminRecipientUbts(parsed.data))
    } catch (error) {
      const mapped = mapAdminNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/recipients/prefeitura-users', { preHandler: canView }, async (request, reply) => {
    const parsed = recipientCatalogQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatAdminNotificacoesValidationError(parsed.error) })
    }

    try {
      return reply.send(await listAdminRecipientPrefeituraUsers(parsed.data))
    } catch (error) {
      const mapped = mapAdminNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/recipients/ubt-users', { preHandler: canView }, async (request, reply) => {
    const parsed = recipientCatalogQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatAdminNotificacoesValidationError(parsed.error) })
    }

    try {
      return reply.send(await listAdminRecipientUbtUsers(parsed.data))
    } catch (error) {
      const mapped = mapAdminNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/recipients/profissionais', { preHandler: canView }, async (request, reply) => {
    const parsed = recipientCatalogQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatAdminNotificacoesValidationError(parsed.error) })
    }

    try {
      return reply.send(await listAdminRecipientProfissionais(parsed.data))
    } catch (error) {
      const mapped = mapAdminNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/recipients/profissionais-stats', { preHandler: canView }, async (_request, reply) => {
    try {
      return reply.send(await getAdminRecipientProfissionaisStats())
    } catch (error) {
      const mapped = mapAdminNotificacoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

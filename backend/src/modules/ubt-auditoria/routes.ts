import type { FastifyInstance } from 'fastify'
import { requireUbtAuth, requireUbtPagePermission } from '../ubt-auth/middleware.js'
import { extractClientIp, extractUserAgent, resolveActorFromRequest } from '../../lib/auditoria/context.js'
import {
  getAuditoriaSummary,
  listAuditoriaEntries,
  recordClientAuditoriaEvent,
} from '../auditoria/list.service.js'
import { clientAuditoriaEventSchema, listAuditoriaQuerySchema } from '../auditoria/schemas.js'
import { resolveAuditoriaScopeFilter } from '../auditoria/scope.service.js'

const canView = requireUbtPagePermission('auditoria', 'visualizar')

export async function registerUbtAuditoriaRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUbtAuth)

  app.get('/', { preHandler: canView }, async (request, reply) => {
    const parsed = listAuditoriaQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const scope = await resolveAuditoriaScopeFilter('ubt', {
        unidadeUbtId: request.ubtUser!.unidadeUbtId,
      })
      const result = await listAuditoriaEntries(scope, parsed.data)
      reply.header('Cache-Control', 'private, max-age=5')
      return reply.send(result)
    } catch {
      return reply.status(500).send({ error: 'Não foi possível carregar a auditoria.' })
    }
  })

  app.get('/summary', { preHandler: canView }, async (request, reply) => {
    const parsed = listAuditoriaQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const scope = await resolveAuditoriaScopeFilter('ubt', {
        unidadeUbtId: request.ubtUser!.unidadeUbtId,
      })
      const summary = await getAuditoriaSummary(scope, parsed.data)
      reply.header('Cache-Control', 'private, max-age=10')
      return reply.send(summary)
    } catch {
      return reply.status(500).send({ error: 'Não foi possível carregar o resumo.' })
    }
  })

  app.post('/eventos', async (request, reply) => {
    const parsed = clientAuditoriaEventSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Payload inválido.' })
    }

    const actor = resolveActorFromRequest(request)
    if (!actor?.atorId) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    try {
      await recordClientAuditoriaEvent({
        actor,
        ip: extractClientIp(request),
        userAgent: extractUserAgent(request),
        ...parsed.data,
      })
      return reply.status(204).send()
    } catch {
      return reply.status(500).send({ error: 'Não foi possível registrar o evento.' })
    }
  })
}

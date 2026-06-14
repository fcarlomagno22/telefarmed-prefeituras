import type { FastifyInstance } from 'fastify'
import { requireProfissionalAuth } from '../profissional-auth/middleware.js'
import { extractClientIp, extractUserAgent, resolveActorFromRequest } from '../../lib/auditoria/context.js'
import { recordClientAuditoriaEvent } from '../auditoria/list.service.js'
import { clientAuditoriaEventSchema } from '../auditoria/schemas.js'

export async function registerProfissionalAuditoriaRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireProfissionalAuth)

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

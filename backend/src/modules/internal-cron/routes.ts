import type { FastifyInstance } from 'fastify'
import { assertCronSecret } from './auth.js'
import { mapInternalCronError } from './errors.js'
import { runPosConsultaCronJobs } from '../pos-consulta/cron.service.js'

/** Sem rate limit agressivo — chamado apenas pelo agendador (1× a cada poucos minutos). */
const CRON_ROUTE_CONFIG = {
  rateLimit: {
    max: 12,
    timeWindow: '1 minute',
  },
} as const

export async function registerInternalCronRoutes(app: FastifyInstance): Promise<void> {
  app.get('/pos-consulta', { config: CRON_ROUTE_CONFIG }, async (request, reply) => {
    try {
      assertCronSecret(request)
      await runPosConsultaCronJobs()
      return reply.send({ ok: true, job: 'pos-consulta' })
    } catch (error) {
      const mapped = mapInternalCronError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

}

import type { FastifyInstance } from 'fastify'
import { env } from '../../config/env.js'
import { rh3ConsultaStatusWebhookSchema } from './schemas.js'
import { handleRh3ConsultaStatusWebhook } from './service.js'

const WEBHOOK_RATE_LIMIT = {
  rateLimit: {
    max: 120,
    timeWindow: '1 minute',
  },
} as const

function isWebhookAuthorized(request: { headers: Record<string, unknown> }): boolean {
  const secret = env.RH3_WEBHOOK_SECRET?.trim()
  if (!secret) return true

  const authorization = String(request.headers.authorization ?? '')
  if (authorization === `Bearer ${secret}`) return true

  const headerSecret = String(request.headers['x-rh3-webhook-secret'] ?? '')
  return headerSecret === secret
}

export async function registerRh3WebhookRoutes(app: FastifyInstance): Promise<void> {
  app.post('/consultas-status', { config: WEBHOOK_RATE_LIMIT }, async (request, reply) => {
    if (!isWebhookAuthorized(request)) {
      return reply.status(401).send({ error: 'Webhook não autorizado.' })
    }

    const parsed = rh3ConsultaStatusWebhookSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Payload inválido.',
        details: parsed.error.flatten(),
      })
    }

    try {
      const result = await handleRh3ConsultaStatusWebhook(parsed.data)
      request.log.info(
        {
          rh3Webhook: {
            idTurno: parsed.data.id_turno,
            idEstado: parsed.data.id_estado,
            idConsultaVirtual: parsed.data.id_consulta_virtual ?? null,
          },
        },
        'rh3 consulta status webhook received',
      )
      return reply.send(result)
    } catch (error) {
      request.log.error({ err: error }, 'rh3 consulta status webhook failed')
      return reply.status(500).send({ error: 'Não foi possível processar o webhook.' })
    }
  })
}

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { isWhoIcdApiConfigured, searchWhoIcd } from '../../lib/icd-who/client.js'

const ICD_SEARCH_RATE_LIMIT = {
  rateLimit: {
    max: 60,
    timeWindow: '1 minute',
  },
} as const

const icdSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
  limit: z.coerce.number().int().min(1).max(12).optional().default(8),
})

export async function registerIcdReferenceRoutes(app: FastifyInstance): Promise<void> {
  app.get('/search', { config: ICD_SEARCH_RATE_LIMIT }, async (request, reply) => {
    const parsed = icdSearchQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Informe ao menos 2 caracteres para buscar o CID.',
      })
    }

    if (!isWhoIcdApiConfigured()) {
      return reply.status(503).send({
        error: 'Busca CID (OMS) indisponível. Configure WHO_ICD_CLIENT_ID e WHO_ICD_CLIENT_SECRET.',
        configured: false,
        results: [],
      })
    }

    try {
      const results = await searchWhoIcd(parsed.data.q, parsed.data.limit)
      return reply.send({
        configured: true,
        results,
      })
    } catch (error) {
      request.log.error({ err: error }, 'who icd search failed')
      return reply.status(502).send({
        error: 'Não foi possível consultar a API ICD da OMS.',
        configured: true,
        results: [],
      })
    }
  })
}

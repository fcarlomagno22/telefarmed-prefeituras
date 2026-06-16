import type { FastifyInstance } from 'fastify'
import {
  formatPublicLiveShareValidationError,
  mapPublicLiveShareError,
} from './errors.js'
import { getLiveShareSessionByToken } from './query.service.js'
import { liveShareTokenParamSchema } from './schemas.js'

const PUBLIC_LIVE_SHARE_RATE_LIMIT = {
  rateLimit: {
    max: 60,
    timeWindow: '1 minute',
  },
} as const

export async function registerPublicLiveShareRoutes(app: FastifyInstance): Promise<void> {
  app.get('/:token', { config: PUBLIC_LIVE_SHARE_RATE_LIMIT }, async (request, reply) => {
    const parsed = liveShareTokenParamSchema.safeParse(
      (request.params as { token?: string }).token,
    )
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatPublicLiveShareValidationError(parsed.error) })
    }

    try {
      const result = await getLiveShareSessionByToken(parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapPublicLiveShareError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

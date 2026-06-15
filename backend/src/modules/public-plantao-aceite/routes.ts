import type { FastifyInstance } from 'fastify'
import {
  formatPublicPlantaoAceiteValidationError,
  mapPublicPlantaoAceiteError,
} from './errors.js'
import {
  confirmarPlantaoAceiteBodySchema,
  candidatarReservaPlantaoAceiteBodySchema,
  plantaoAceiteIcsQuerySchema,
  plantaoAceiteTokenParamSchema,
} from './schemas.js'
import { getPlantaoAceitePublicoByToken } from './query.service.js'
import { confirmarPlantaoAceitePublico } from './confirmar.service.js'
import { candidatarReservaPlantaoAceitePublico } from './reserva.service.js'
import { buildPlantaoAceiteIcsDownload } from './ics.service.js'

const PUBLIC_PLANTAO_ACEITE_RATE_LIMIT = {
  rateLimit: {
    max: 30,
    timeWindow: '1 minute',
  },
} as const

const PUBLIC_PLANTAO_ACEITE_CONFIRM_RATE_LIMIT = {
  rateLimit: {
    max: 10,
    timeWindow: '1 minute',
  },
} as const

export async function registerPublicPlantaoAceiteRoutes(app: FastifyInstance): Promise<void> {
  app.get('/:token', { config: PUBLIC_PLANTAO_ACEITE_RATE_LIMIT }, async (request, reply) => {
    const parsed = plantaoAceiteTokenParamSchema.safeParse(
      (request.params as { token?: string }).token,
    )
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatPublicPlantaoAceiteValidationError(parsed.error) })
    }

    try {
      const result = await getPlantaoAceitePublicoByToken(parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapPublicPlantaoAceiteError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/confirmar',
    { config: PUBLIC_PLANTAO_ACEITE_CONFIRM_RATE_LIMIT },
    async (request, reply) => {
      const parsed = confirmarPlantaoAceiteBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ error: formatPublicPlantaoAceiteValidationError(parsed.error) })
      }

      try {
        const result = await confirmarPlantaoAceitePublico(parsed.data)
        return reply.send(result)
      } catch (error) {
        const mapped = mapPublicPlantaoAceiteError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post(
    '/candidatar-reserva',
    { config: PUBLIC_PLANTAO_ACEITE_CONFIRM_RATE_LIMIT },
    async (request, reply) => {
      const parsed = candidatarReservaPlantaoAceiteBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ error: formatPublicPlantaoAceiteValidationError(parsed.error) })
      }

      try {
        const result = await candidatarReservaPlantaoAceitePublico(parsed.data)
        return reply.send(result)
      } catch (error) {
        const mapped = mapPublicPlantaoAceiteError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.get(
    '/:token/ics',
    { config: PUBLIC_PLANTAO_ACEITE_RATE_LIMIT },
    async (request, reply) => {
      const parsedToken = plantaoAceiteTokenParamSchema.safeParse(
        (request.params as { token?: string }).token,
      )
      if (!parsedToken.success) {
        return reply
          .status(400)
          .send({ error: formatPublicPlantaoAceiteValidationError(parsedToken.error) })
      }

      const parsedQuery = plantaoAceiteIcsQuerySchema.safeParse(request.query)
      if (!parsedQuery.success) {
        return reply
          .status(400)
          .send({ error: formatPublicPlantaoAceiteValidationError(parsedQuery.error) })
      }

      try {
        const download = await buildPlantaoAceiteIcsDownload({
          token: parsedToken.data,
          plantaoId: parsedQuery.data.plantaoId,
        })

        reply.header('Content-Type', 'text/calendar; charset=utf-8')
        reply.header(
          'Content-Disposition',
          `attachment; filename="${download.filename}"`,
        )
        reply.header('Cache-Control', 'private, no-store')
        return reply.send(download.content)
      } catch (error) {
        const mapped = mapPublicPlantaoAceiteError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )
}

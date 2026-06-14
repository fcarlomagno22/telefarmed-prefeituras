import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  requireProfissionalAuth,
  requireProfissionalPagePermission,
} from '../profissional-auth/middleware.js'
import {
  formatProfissionalAvaliacaoValidationError,
  mapProfissionalAvaliacaoError,
} from './errors.js'
import { listProfissionalAvaliacoes } from './list.service.js'
import { listAvaliacoesQuerySchema } from './schemas.js'
import { getProfissionalAvaliacoesSummary } from './summary.service.js'

const canView = requireProfissionalPagePermission('avaliacao', 'visualizar')

function profissionalId(request: FastifyRequest): string {
  return request.profissionalUser!.id
}

function parseListQuery(request: FastifyRequest) {
  return listAvaliacoesQuerySchema.safeParse(request.query ?? {})
}

export async function registerProfissionalAvaliacaoRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireProfissionalAuth)

  app.get('/summary', { preHandler: canView }, async (request, reply) => {
    const parsed = parseListQuery(request)
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatProfissionalAvaliacaoValidationError(parsed.error) })
    }

    try {
      const { limit: _limit, offset: _offset, ...summaryQuery } = parsed.data
      const summary = await getProfissionalAvaliacoesSummary(profissionalId(request), summaryQuery)
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send(summary)
    } catch (error) {
      const mapped = mapProfissionalAvaliacaoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/', { preHandler: canView }, async (request, reply) => {
    const parsed = parseListQuery(request)
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatProfissionalAvaliacaoValidationError(parsed.error) })
    }

    try {
      const result = await listProfissionalAvaliacoes(profissionalId(request), parsed.data)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(result)
    } catch (error) {
      const mapped = mapProfissionalAvaliacaoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

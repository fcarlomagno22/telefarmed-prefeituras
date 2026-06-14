import type { FastifyInstance } from 'fastify'
import {
  requirePrefeituraAuth,
  requirePrefeituraPagePermission,
} from '../prefeitura-auth/middleware.js'
import { mapPrefeituraConsultasError } from './errors.js'
import {
  getPrefeituraConsultasOverview,
  getPrefeituraConsultasUnitDetail,
} from './overview.service.js'
import { overviewQuerySchema, unitDetailQuerySchema, unitIdParamSchema } from './schemas.js'

const canView = requirePrefeituraPagePermission('consultas', 'visualizar')

function entidadeId(request: { prefeituraUser?: { entidadeContratanteId: string } }) {
  return request.prefeituraUser!.entidadeContratanteId
}

export async function registerPrefeituraConsultasRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requirePrefeituraAuth)

  app.get('/overview', { preHandler: canView }, async (request, reply) => {
    const parsed = overviewQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const overview = await getPrefeituraConsultasOverview(entidadeId(request), parsed.data)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(overview)
    } catch (error) {
      const mapped = mapPrefeituraConsultasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/units/:unitId', { preHandler: canView }, async (request, reply) => {
    const params = unitIdParamSchema.safeParse(request.params)
    const query = unitDetailQuerySchema.safeParse(request.query)
    if (!params.success || !query.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const detail = await getPrefeituraConsultasUnitDetail(
        entidadeId(request),
        params.data.unitId,
        query.data,
      )
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send({ detail })
    } catch (error) {
      const mapped = mapPrefeituraConsultasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

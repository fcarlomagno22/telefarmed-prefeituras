import type { FastifyInstance } from 'fastify'
import {
  requirePrefeituraAuth,
  requirePrefeituraPagePermission,
} from '../prefeitura-auth/middleware.js'
import { mapPrefeituraDashboardError } from './errors.js'
import { getPrefeituraDashboardOverview } from './overview.service.js'
import { dashboardOverviewQuerySchema } from './schemas.js'

const canView = requirePrefeituraPagePermission('dashboard', 'visualizar')

function entidadeId(request: { prefeituraUser?: { entidadeContratanteId: string } }) {
  return request.prefeituraUser!.entidadeContratanteId
}

export async function registerPrefeituraDashboardRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requirePrefeituraAuth)

  app.get('/overview', { preHandler: canView }, async (request, reply) => {
    const parsed = dashboardOverviewQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const overview = await getPrefeituraDashboardOverview(entidadeId(request), parsed.data)
      reply.header('Cache-Control', 'private, max-age=10')
      return reply.send(overview)
    } catch (error) {
      const mapped = mapPrefeituraDashboardError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

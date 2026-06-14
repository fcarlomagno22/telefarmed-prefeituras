import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  requireAdminAuth,
  requireAdminPagePermission,
} from '../admin-auth/middleware.js'
import {
  formatAdminDashboardValidationError,
  mapAdminDashboardError,
} from './errors.js'
import { getAdminDashboardOverview } from './overview.service.js'
import { updateNocIncident } from './noc.service.js'
import {
  adminDashboardNocIncidentParamsSchema,
  adminDashboardNocIncidentPatchSchema,
  adminDashboardOverviewQuerySchema,
} from './schemas.js'

const canView = requireAdminPagePermission('dashboard', 'visualizar')
const canEdit = requireAdminPagePermission('dashboard', 'editar')

function resolveActorName(request: FastifyRequest): string {
  const admin = request.admin
  if (!admin) return 'Administrador'
  return admin.nome?.trim() || 'Administrador'
}

export async function registerAdminDashboardRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdminAuth)

  app.get('/overview', { preHandler: canView }, async (request, reply) => {
    const parsed = adminDashboardOverviewQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      const mapped = formatAdminDashboardValidationError()
      return reply.status(mapped.statusCode).send(mapped.body)
    }

    try {
      const overview = await getAdminDashboardOverview(parsed.data)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(overview)
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        request.log.error({ err: error }, 'admin dashboard overview failed')
      }
      const mapped = mapAdminDashboardError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/noc-incidents/:id', { preHandler: canEdit }, async (request, reply) => {
    const paramsParsed = adminDashboardNocIncidentParamsSchema.safeParse(request.params)
    const bodyParsed = adminDashboardNocIncidentPatchSchema.safeParse(request.body)

    if (!paramsParsed.success || !bodyParsed.success) {
      const mapped = formatAdminDashboardValidationError()
      return reply.status(mapped.statusCode).send(mapped.body)
    }

    try {
      const incident = await updateNocIncident({
        incidentId: paramsParsed.data.id,
        actorName: resolveActorName(request),
        team: bodyParsed.data.team,
        assignee: bodyParsed.data.assignee,
        status: bodyParsed.data.status,
      })
      return reply.send({ incident })
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        request.log.error({ err: error }, 'admin dashboard noc update failed')
      }
      const mapped = mapAdminDashboardError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

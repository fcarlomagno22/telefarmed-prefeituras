import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  requireProfissionalAuth,
  requireProfissionalPagePermission,
} from '../profissional-auth/middleware.js'
import {
  formatProfissionalAgendaValidationError,
  mapProfissionalAgendaError,
} from './errors.js'
import { markAgendaConsultaNaoCompareceu } from './nao-compareceu.service.js'
import {
  getProfissionalAgendaOverview,
  listProfissionalAgendaPlantaoConsultas,
  loadProfissionalAgendaContext,
} from './overview.service.js'
import {
  consultaIdParamSchema,
  endShiftBodySchema,
  overviewQuerySchema,
  plantaoIdParamSchema,
} from './schemas.js'
import { endProfissionalPlantao, enterProfissionalPlantao } from './sessao.service.js'

const canView = requireProfissionalPagePermission('agenda', 'visualizar')
const canEdit = requireProfissionalPagePermission('agenda', 'editar')

function profissionalId(request: FastifyRequest): string {
  return request.profissionalUser!.id
}

async function loadContext(request: FastifyRequest) {
  return loadProfissionalAgendaContext(profissionalId(request))
}

export async function registerProfissionalAgendaRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireProfissionalAuth)

  app.get('/overview', { preHandler: canView }, async (request, reply) => {
    const parsed = overviewQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: formatProfissionalAgendaValidationError(parsed.error) })
    }

    try {
      const ctx = await loadContext(request)
      const overview = await getProfissionalAgendaOverview(ctx, parsed.data)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(overview)
    } catch (error) {
      const mapped = mapProfissionalAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/plantoes/:plantaoId/consultas', { preHandler: canView }, async (request, reply) => {
    const params = plantaoIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'ID do plantão inválido.' })
    }

    try {
      const ctx = await loadContext(request)
      const consultas = await listProfissionalAgendaPlantaoConsultas(ctx, params.data.plantaoId)
      reply.header('Cache-Control', 'private, max-age=10')
      return reply.send({ consultas })
    } catch (error) {
      const mapped = mapProfissionalAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/plantoes/:plantaoId/entrar', { preHandler: canEdit }, async (request, reply) => {
    const params = plantaoIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'ID do plantão inválido.' })
    }

    try {
      const ctx = await loadContext(request)
      const session = await enterProfissionalPlantao(ctx.profissionalId, params.data.plantaoId)
      return reply.send({ session })
    } catch (error) {
      const mapped = mapProfissionalAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/plantoes/:plantaoId/encerrar', { preHandler: canEdit }, async (request, reply) => {
    const params = plantaoIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'ID do plantão inválido.' })
    }

    const body = endShiftBodySchema.safeParse(request.body ?? {})
    if (!body.success) {
      return reply.status(400).send({ error: formatProfissionalAgendaValidationError(body.error) })
    }

    try {
      const ctx = await loadContext(request)
      const session = await endProfissionalPlantao(
        ctx.profissionalId,
        params.data.plantaoId,
        body.data,
      )
      return reply.send({ session })
    } catch (error) {
      const mapped = mapProfissionalAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/consultas/:consultaId/nao-compareceu',
    { preHandler: canEdit },
    async (request, reply) => {
      const params = consultaIdParamSchema.safeParse(request.params)
      if (!params.success) {
        return reply.status(400).send({ error: 'ID da consulta inválido.' })
      }

      try {
        const ctx = await loadContext(request)
        await markAgendaConsultaNaoCompareceu(ctx, params.data.consultaId)
        return reply.status(204).send()
      } catch (error) {
        const mapped = mapProfissionalAgendaError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )
}

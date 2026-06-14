import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  requireProfissionalAuth,
  requireProfissionalPagePermission,
} from '../profissional-auth/middleware.js'
import {
  cancelarProfissionalEscalaInscricao,
  cancelarProfissionalEscalaPlantao,
} from './cancel.service.js'
import { loadProfissionalEscalaContext } from './context.service.js'
import { listProfissionalEscalaDisponiveis } from './disponiveis.service.js'
import {
  formatProfissionalEscalaValidationError,
  mapProfissionalEscalaError,
} from './errors.js'
import { inscreverProfissionalEscalaSlot } from './inscrever.service.js'
import { listProfissionalMeusPlantoes } from './plantoes.service.js'
import {
  inscricaoIdParamSchema,
  listDisponiveisQuerySchema,
  plantaoIdParamSchema,
  slotIdParamSchema,
} from './schemas.js'
import { getProfissionalEscalaSummary } from './summary.service.js'

const canView = requireProfissionalPagePermission('escala', 'visualizar')
const canInsert = requireProfissionalPagePermission('escala', 'inserir')
const canEdit = requireProfissionalPagePermission('escala', 'editar')

function profissionalId(request: FastifyRequest): string {
  return request.profissionalUser!.id
}

async function loadContext(request: FastifyRequest) {
  return loadProfissionalEscalaContext(profissionalId(request))
}

export async function registerProfissionalEscalaRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireProfissionalAuth)

  app.get('/disponiveis', { preHandler: canView }, async (request, reply) => {
    const parsed = listDisponiveisQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: formatProfissionalEscalaValidationError(parsed.error) })
    }

    try {
      const ctx = await loadContext(request)
      const shifts = await listProfissionalEscalaDisponiveis(ctx, parsed.data)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send({ shifts })
    } catch (error) {
      const mapped = mapProfissionalEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/meus-plantoes', { preHandler: canView }, async (request, reply) => {
    try {
      const ctx = await loadContext(request)
      const plantoes = await listProfissionalMeusPlantoes(ctx)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send({ plantoes })
    } catch (error) {
      const mapped = mapProfissionalEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/summary', { preHandler: canView }, async (request, reply) => {
    try {
      const ctx = await loadContext(request)
      const summary = await getProfissionalEscalaSummary(ctx)
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send(summary)
    } catch (error) {
      const mapped = mapProfissionalEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/slots/:slotId/inscrever', { preHandler: canInsert }, async (request, reply) => {
    const params = slotIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'ID do plantão inválido.' })
    }

    try {
      const ctx = await loadContext(request)
      const result = await inscreverProfissionalEscalaSlot(ctx, params.data.slotId)
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapProfissionalEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/inscricoes/:inscricaoId', { preHandler: canEdit }, async (request, reply) => {
    const params = inscricaoIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'ID da inscrição inválido.' })
    }

    try {
      const ctx = await loadContext(request)
      await cancelarProfissionalEscalaInscricao(ctx, params.data.inscricaoId)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapProfissionalEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/plantoes/:plantaoId', { preHandler: canEdit }, async (request, reply) => {
    const params = plantaoIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'ID do plantão confirmado inválido.' })
    }

    try {
      const ctx = await loadContext(request)
      await cancelarProfissionalEscalaPlantao(ctx, params.data.plantaoId)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapProfissionalEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

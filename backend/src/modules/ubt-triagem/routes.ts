import type { FastifyInstance } from 'fastify'
import {
  requireAnyUbtPagePermission,
  requireUbtAuth,
} from '../ubt-auth/middleware.js'
import type { UbtScope } from '../ubt-pacientes/types.js'
import { getTriagemDashboard } from './dashboard.service.js'
import {
  formatUbtTriagemValidationError,
  mapUbtTriagemError,
} from './errors.js'
import {
  chamarFilaPaciente,
  chamarFilaProximo,
  checkInUbtFila,
  getFilaLive,
  getTriagemEspecialidadeCatalog,
  updateFilaStatus,
} from './fila.service.js'
import {
  checkInBodySchema,
  filaIdParamsSchema,
  filaStatusUpdateBodySchema,
  isoDateSchema,
} from './schemas.js'
import { z } from 'zod'

const canView = requireAnyUbtPagePermission(['triagem', 'agenda'], 'visualizar')
const canInsert = requireAnyUbtPagePermission(['triagem', 'agenda'], 'inserir')
const canEdit = requireAnyUbtPagePermission(['triagem', 'agenda'], 'editar')

function scope(request: {
  ubtUser?: {
    id: string
    nome: string
    entidadeContratanteId: string
    unidadeUbtId: string
  }
}): UbtScope {
  return {
    operadorId: request.ubtUser!.id,
    operadorNome: request.ubtUser!.nome,
    entidadeContratanteId: request.ubtUser!.entidadeContratanteId,
    unidadeUbtId: request.ubtUser!.unidadeUbtId,
  }
}

export async function registerUbtTriagemRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUbtAuth)

  app.get('/especialidades', { preHandler: canView }, async (request, reply) => {
    const parsed = z.object({ date: isoDateSchema.optional() }).safeParse(request.query)

    const date =
      parsed.success && parsed.data.date
        ? parsed.data.date
        : new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date())

    try {
      const catalog = await getTriagemEspecialidadeCatalog(scope(request), date)
      reply.header('Cache-Control', 'private, max-age=20')
      return reply.send(catalog)
    } catch (error) {
      const mapped = mapUbtTriagemError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/dashboard', { preHandler: canView }, async (request, reply) => {
    try {
      const dashboard = await getTriagemDashboard(
        scope(request),
        request.ubtUser!.nome,
      )
      reply.header('Cache-Control', 'private, max-age=10')
      return reply.send(dashboard)
    } catch (error) {
      const mapped = mapUbtTriagemError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/fila', { preHandler: canView }, async (request, reply) => {
    try {
      const fila = await getFilaLive(scope(request))
      reply.header('Cache-Control', 'private, max-age=5')
      return reply.send(fila)
    } catch (error) {
      const mapped = mapUbtTriagemError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/fila/check-in', { preHandler: canInsert }, async (request, reply) => {
    const parsed = checkInBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: formatUbtTriagemValidationError(parsed.error) })
    }

    try {
      const entry = await checkInUbtFila(scope(request), parsed.data.agendaConsultaId)
      return reply.status(201).send({ entry })
    } catch (error) {
      const mapped = mapUbtTriagemError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/fila/chamar-proximo', { preHandler: canEdit }, async (request, reply) => {
    try {
      const entry = await chamarFilaProximo(scope(request))
      return reply.send({ entry })
    } catch (error) {
      const mapped = mapUbtTriagemError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/fila/:id/chamar', { preHandler: canEdit }, async (request, reply) => {
    const params = filaIdParamsSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Identificador de fila inválido.' })
    }

    try {
      const entry = await chamarFilaPaciente(scope(request), params.data.id)
      return reply.send({ entry })
    } catch (error) {
      const mapped = mapUbtTriagemError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/fila/:id/status', { preHandler: canEdit }, async (request, reply) => {
    const params = filaIdParamsSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Identificador de fila inválido.' })
    }

    const parsed = filaStatusUpdateBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: formatUbtTriagemValidationError(parsed.error) })
    }

    try {
      const entry = await updateFilaStatus(scope(request), params.data.id, parsed.data.status)
      return reply.send({ entry })
    } catch (error) {
      const mapped = mapUbtTriagemError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

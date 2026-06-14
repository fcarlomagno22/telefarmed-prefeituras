import type { FastifyInstance } from 'fastify'
import {
  requireAnyUbtPagePermission,
  requireUbtAuth,
} from '../ubt-auth/middleware.js'
import type { UbtScope } from '../ubt-pacientes/types.js'
import {
  entrarUbtSalaEspera,
  iniciarUbtConsulta,
  registrarUbtConsultaAvaliacao,
  sairUbtSalaEspera,
} from './consultas.service.js'
import {
  formatUbtConsultasValidationError,
  mapUbtConsultasError,
} from './errors.js'
import { listUbtConsultas } from './list.service.js'
import { getUbtConsultasOverview } from './overview.service.js'
import {
  entrarSalaEsperaBodySchema,
  iniciarConsultaBodySchema,
  listUbtConsultasQuerySchema,
  overviewUbtConsultasQuerySchema,
  registrarAvaliacaoBodySchema,
} from './schemas.js'

const sessionPages = ['triagem', 'agenda'] as const

const canViewConsultas = requireAnyUbtPagePermission(['consultas'], 'visualizar')
const canInsertSession = requireAnyUbtPagePermission([...sessionPages], 'inserir')
const canEditSession = requireAnyUbtPagePermission([...sessionPages], 'editar')

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

export async function registerUbtConsultasRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUbtAuth)

  app.get('/overview', { preHandler: canViewConsultas }, async (request, reply) => {
    const parsed = overviewUbtConsultasQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: formatUbtConsultasValidationError(parsed.error) })
    }

    try {
      const overview = await getUbtConsultasOverview(scope(request), parsed.data)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(overview)
    } catch (error) {
      const mapped = mapUbtConsultasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/', { preHandler: canViewConsultas }, async (request, reply) => {
    const parsed = listUbtConsultasQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: formatUbtConsultasValidationError(parsed.error) })
    }

    try {
      const result = await listUbtConsultas(scope(request), parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapUbtConsultasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/iniciar', { preHandler: canInsertSession }, async (request, reply) => {
    const parsed = iniciarConsultaBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: formatUbtConsultasValidationError(parsed.error) })
    }

    try {
      const session = await iniciarUbtConsulta(scope(request), parsed.data)
      return reply.status(201).send(session)
    } catch (error) {
      const mapped = mapUbtConsultasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/sala-espera/entrar', { preHandler: canInsertSession }, async (request, reply) => {
    const parsed = entrarSalaEsperaBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: formatUbtConsultasValidationError(parsed.error) })
    }

    try {
      const fila = await entrarUbtSalaEspera(scope(request), parsed.data.codigoAtendimento)
      return reply.send(fila)
    } catch (error) {
      const mapped = mapUbtConsultasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/sala-espera/sair', { preHandler: canEditSession }, async (request, reply) => {
    const parsed = entrarSalaEsperaBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: formatUbtConsultasValidationError(parsed.error) })
    }

    try {
      await sairUbtSalaEspera(scope(request), parsed.data.codigoAtendimento)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapUbtConsultasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/avaliacao', { preHandler: canEditSession }, async (request, reply) => {
    const parsed = registrarAvaliacaoBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: formatUbtConsultasValidationError(parsed.error) })
    }

    try {
      await registrarUbtConsultaAvaliacao(
        scope(request),
        parsed.data.codigoAtendimento,
        parsed.data.nota,
        parsed.data.comentario,
      )
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapUbtConsultasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

import type { FastifyInstance } from 'fastify'
import {
  requireAdminAuth,
  requireAdminPagePermission,
} from '../admin-auth/middleware.js'
import {
  requirePrefeituraAuth,
  requirePrefeituraPagePermission,
} from '../prefeitura-auth/middleware.js'
import {
  requireProfissionalAuth,
  requireProfissionalPagePermission,
} from '../profissional-auth/middleware.js'
import { getPublicPosConsultaCheckin, submitPublicPosConsultaCheckin } from './checkin.service.js'
import { mapPosConsultaError } from './errors.js'
import { getProfissionalPacientePosConsultaHistorico } from './historico.service.js'
import { getAdminPosConsultaMetrics, getPrefeituraPosConsultaMetrics } from './metrics.service.js'
import {
  adminPosConsultaMetricsQuerySchema,
  posConsultaCheckinRespostasSchema,
  posConsultaTokenParamSchema,
  prefeituraPosConsultaMetricsQuerySchema,
  profissionalHistoricoParamsSchema,
  profissionalHistoricoQuerySchema,
} from './schemas.js'

const PUBLIC_CHECKIN_RATE_LIMIT = {
  rateLimit: {
    max: 30,
    timeWindow: '1 minute',
  },
} as const

function profissionalId(request: { profissionalUser?: { id: string } }) {
  return request.profissionalUser!.id
}

function entidadeId(request: { prefeituraUser?: { entidadeContratanteId: string } }) {
  return request.prefeituraUser!.entidadeContratanteId
}

export async function registerPublicPosConsultaRoutes(app: FastifyInstance): Promise<void> {
  app.get('/checkins/:token', { config: PUBLIC_CHECKIN_RATE_LIMIT }, async (request, reply) => {
    const parsed = posConsultaTokenParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Token inválido.' })
    }

    try {
      const context = await getPublicPosConsultaCheckin(parsed.data.token)
      return reply.send(context)
    } catch (error) {
      const mapped = mapPosConsultaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/checkins/:token', { config: PUBLIC_CHECKIN_RATE_LIMIT }, async (request, reply) => {
    const parsedParams = posConsultaTokenParamSchema.safeParse(request.params)
    const parsedBody = posConsultaCheckinRespostasSchema.safeParse(request.body ?? {})

    if (!parsedParams.success || !parsedBody.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const result = await submitPublicPosConsultaCheckin(parsedParams.data.token, parsedBody.data)
      return reply.send(result)
    } catch (error) {
      const mapped = mapPosConsultaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

export async function registerProfissionalPosConsultaRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireProfissionalAuth)
  const canView = requireProfissionalPagePermission('atendimentos', 'visualizar')

  app.get(
    '/pacientes/:pacienteId/historico',
    { preHandler: canView },
    async (request, reply) => {
      const parsedParams = profissionalHistoricoParamsSchema.safeParse(request.params)
      const parsedQuery = profissionalHistoricoQuerySchema.safeParse(request.query)

      if (!parsedParams.success || !parsedQuery.success) {
        return reply.status(400).send({ error: 'Parâmetros inválidos.' })
      }

      try {
        const historico = await getProfissionalPacientePosConsultaHistorico(
          profissionalId(request),
          parsedParams.data.pacienteId,
          parsedQuery.data.specialty,
        )
        return reply.send(historico)
      } catch (error) {
        const mapped = mapPosConsultaError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )
}

export async function registerPrefeituraPosConsultaDashboardRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.addHook('preHandler', requirePrefeituraAuth)
  const canView = requirePrefeituraPagePermission('dashboard', 'visualizar')

  app.get('/pos-consulta', { preHandler: canView }, async (request, reply) => {
    const parsed = prefeituraPosConsultaMetricsQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const metrics = await getPrefeituraPosConsultaMetrics({
        entidadeContratanteId: entidadeId(request),
        ...parsed.data,
      })
      reply.header('Cache-Control', 'private, max-age=10')
      return reply.send(metrics)
    } catch (error) {
      const mapped = mapPosConsultaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

export async function registerAdminPosConsultaDashboardRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdminAuth)
  const canView = requireAdminPagePermission('dashboard', 'visualizar')

  app.get('/pos-consulta', { preHandler: canView }, async (request, reply) => {
    const parsed = adminPosConsultaMetricsQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const metrics = await getAdminPosConsultaMetrics(parsed.data)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(metrics)
    } catch (error) {
      const mapped = mapPosConsultaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

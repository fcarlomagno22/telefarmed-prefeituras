import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import {
  hasPrefeituraPagePermission,
  type PermissionAction,
  type PrefeituraPageId,
} from '../../lib/prefeituraPermissions.js'
import {
  requirePrefeituraAuth,
  requirePrefeituraPagePermission,
} from '../prefeitura-auth/middleware.js'
import { getPrefeituraUtilizacaoCiclo } from './cycle-usage.service.js'
import {
  getPrefeituraContratoAtivo,
  getPrefeituraContratoById,
  listPrefeituraContratos,
} from './contratos.service.js'
import { mapPrefeituraContratoError, PrefeituraContratoError } from './errors.js'
import { getPrefeituraContratoMonthDetail } from './month-detail.service.js'
import { contratoIdParamSchema, contratoMonthParamSchema, cycleUsageQuerySchema } from './schemas.js'

const PACKAGE_PAGES: PrefeituraPageId[] = ['agendas', 'dashboard', 'contrato']

function entidadeId(request: { prefeituraUser?: { entidadeContratanteId: string } }) {
  return request.prefeituraUser!.entidadeContratanteId
}

function requireAnyPrefeituraPagePermission(pages: PrefeituraPageId[], action: PermissionAction) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = request.prefeituraUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    const allowed = pages.some((page) =>
      hasPrefeituraPagePermission(user.pagePermissions, page, action, {
        accessLevel: user.accessLevel,
      }),
    )

    if (!allowed) {
      return reply.status(403).send({
        error: 'Você não tem permissão para esta ação.',
        code: 'FORBIDDEN',
      })
    }
  }
}

const canViewPackage = requireAnyPrefeituraPagePermission(PACKAGE_PAGES, 'visualizar')
const canViewContrato = requirePrefeituraPagePermission('contrato', 'visualizar')

function mapError(error: unknown) {
  if (error instanceof PrefeituraContratoError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }
  return mapPrefeituraContratoError(error)
}

export async function registerPrefeituraContratoRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requirePrefeituraAuth)

  app.get('/utilizacao-ciclo', { preHandler: canViewPackage }, async (request, reply) => {
    const parsed = cycleUsageQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const usage = await getPrefeituraUtilizacaoCiclo(entidadeId(request), parsed.data)
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send(usage)
    } catch (error) {
      const mapped = mapError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/contratos', { preHandler: canViewContrato }, async (request, reply) => {
    try {
      const contratos = await listPrefeituraContratos(entidadeId(request))
      reply.header('Cache-Control', 'private, max-age=60')
      return reply.send({ contratos })
    } catch (error) {
      const mapped = mapError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/contratos/ativo', { preHandler: canViewContrato }, async (request, reply) => {
    try {
      const contrato = await getPrefeituraContratoAtivo(entidadeId(request))
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send({ contrato })
    } catch (error) {
      const mapped = mapError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get(
    '/contratos/:id/meses/:year/:month',
    { preHandler: canViewContrato },
    async (request, reply) => {
      const parsed = contratoMonthParamSchema.safeParse(request.params)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Parâmetros inválidos.' })
      }

      try {
        const detail = await getPrefeituraContratoMonthDetail(
          entidadeId(request),
          parsed.data.id,
          parsed.data.year,
          parsed.data.month,
        )
        reply.header('Cache-Control', 'private, max-age=60')
        return reply.send({ detail })
      } catch (error) {
        const mapped = mapError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.get('/contratos/:id', { preHandler: canViewContrato }, async (request, reply) => {
    const parsed = contratoIdParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const contrato = await getPrefeituraContratoById(entidadeId(request), parsed.data.id)
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send({ contrato })
    } catch (error) {
      const mapped = mapError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

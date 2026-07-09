import type { FastifyInstance } from 'fastify'
import type { AuthenticatedVdUser } from '../vd-auth/middleware.js'
import { requireVdAuth } from '../vd-auth/middleware.js'
import { mapVdActiveMindError } from './errors.js'
import { ACTIVE_MIND_CREATE_SESSAO_RATE_LIMIT } from './rate-limits.js'
import { getVdActiveMindPacienteScopeFromRequest } from './scope.js'
import {
  activeMindSessaoIdParamsSchema,
  createActiveMindSessaoBodySchema,
  estatisticasSemanaisQuerySchema,
  formatActiveMindValidationError,
  listActiveMindSessoesQuerySchema,
} from './schemas.js'
import {
  createSessao,
  deleteSessao,
  getActiveMindEstatisticasSemanais,
  listActiveMindSessoes,
} from './service.js'
import { ACTIVE_MIND_E2E_TEST_VD_USER } from './testing/e2eTestVdUser.js'

export type RegisterVdActiveMindRoutesOptions = {
  /** Apenas testes — injeta `request.vdUser` antes de chamar os handlers. */
  skipAuth?: boolean
  /** Usuário VD usado quando `skipAuth` é verdadeiro. */
  testVdUser?: AuthenticatedVdUser
}

export async function registerVdActiveMindRoutes(
  app: FastifyInstance,
  options: RegisterVdActiveMindRoutesOptions = {},
): Promise<void> {
  if (!options.skipAuth) {
    app.addHook('preHandler', requireVdAuth)
  } else {
    app.addHook('preHandler', async (request) => {
      request.vdUser = options.testVdUser ?? ACTIVE_MIND_E2E_TEST_VD_USER
    })
  }

  app.post('/sessoes', { config: ACTIVE_MIND_CREATE_SESSAO_RATE_LIMIT }, async (request, reply) => {
    const parsed = createActiveMindSessaoBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatActiveMindValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdActiveMindPacienteScopeFromRequest(request)
      const result = await createSessao(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.status(result.created ? 201 : 200).send({ session: result.session })
    } catch (error) {
      const mapped = mapVdActiveMindError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/sessoes', async (request, reply) => {
    const parsed = listActiveMindSessoesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatActiveMindValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdActiveMindPacienteScopeFromRequest(request)
      const result = await listActiveMindSessoes(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdActiveMindError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/sessoes/:id', async (request, reply) => {
    const parsed = activeMindSessaoIdParamsSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatActiveMindValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdActiveMindPacienteScopeFromRequest(request)
      const session = await deleteSessao(scope, parsed.data.id)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send({ session })
    } catch (error) {
      const mapped = mapVdActiveMindError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/estatisticas-semanais', async (request, reply) => {
    const parsed = estatisticasSemanaisQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatActiveMindValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdActiveMindPacienteScopeFromRequest(request)
      const stats = await getActiveMindEstatisticasSemanais(scope, {
        weekStartIso: parsed.data.weekStartIso,
      })
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(stats)
    } catch (error) {
      const mapped = mapVdActiveMindError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

import type { FastifyInstance } from 'fastify'
import type { AuthenticatedVdUser } from '../vd-auth/middleware.js'
import { requireVdAuth } from '../vd-auth/middleware.js'
import { mapVdFunctionalTrainingError } from './errors.js'
import { FUNCTIONAL_TRAINING_CREATE_SESSAO_RATE_LIMIT } from './rate-limits.js'
import { getVdFunctionalTrainingPacienteScopeFromRequest } from './scope.js'
import {
  createFunctionalTrainingSessaoBodySchema,
  estatisticasSemanaisQuerySchema,
  formatFunctionalTrainingValidationError,
  functionalTrainingExerciseIdParamsSchema,
  listFunctionalTrainingSessoesQuerySchema,
} from './schemas.js'
import {
  addFunctionalTrainingFavorito,
  getFunctionalTrainingEstatisticasSemanais,
  getFunctionalTrainingFavoritos,
  listFunctionalTrainingSessoes,
  registerFunctionalTrainingSessao,
  removeFunctionalTrainingFavorito,
} from './service.js'
import { FUNCTIONAL_TRAINING_E2E_TEST_VD_USER } from './testing/e2eTestVdUser.js'

export type RegisterVdFunctionalTrainingRoutesOptions = {
  /** Apenas testes — injeta `request.vdUser` antes de chamar os handlers. */
  skipAuth?: boolean
  /** Usuário VD usado quando `skipAuth` é verdadeiro. */
  testVdUser?: AuthenticatedVdUser
}

export async function registerVdFunctionalTrainingRoutes(
  app: FastifyInstance,
  options: RegisterVdFunctionalTrainingRoutesOptions = {},
): Promise<void> {
  if (!options.skipAuth) {
    app.addHook('preHandler', requireVdAuth)
  } else {
    app.addHook('preHandler', async (request) => {
      request.vdUser = options.testVdUser ?? FUNCTIONAL_TRAINING_E2E_TEST_VD_USER
    })
  }

  app.get('/favoritos', async (request, reply) => {
    try {
      const scope = getVdFunctionalTrainingPacienteScopeFromRequest(request)
      const favoritos = await getFunctionalTrainingFavoritos(scope)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(favoritos)
    } catch (error) {
      const mapped = mapVdFunctionalTrainingError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.put('/favoritos/:exerciseId', async (request, reply) => {
    const parsed = functionalTrainingExerciseIdParamsSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatFunctionalTrainingValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdFunctionalTrainingPacienteScopeFromRequest(request)
      const favoritos = await addFunctionalTrainingFavorito(scope, parsed.data.exerciseId)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(favoritos)
    } catch (error) {
      const mapped = mapVdFunctionalTrainingError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/favoritos/:exerciseId', async (request, reply) => {
    const parsed = functionalTrainingExerciseIdParamsSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatFunctionalTrainingValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdFunctionalTrainingPacienteScopeFromRequest(request)
      const favoritos = await removeFunctionalTrainingFavorito(scope, parsed.data.exerciseId)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(favoritos)
    } catch (error) {
      const mapped = mapVdFunctionalTrainingError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/sessoes', { config: FUNCTIONAL_TRAINING_CREATE_SESSAO_RATE_LIMIT }, async (request, reply) => {
    const parsed = createFunctionalTrainingSessaoBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatFunctionalTrainingValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdFunctionalTrainingPacienteScopeFromRequest(request)
      const result = await registerFunctionalTrainingSessao(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.status(result.created ? 201 : 200).send({ session: result.session })
    } catch (error) {
      const mapped = mapVdFunctionalTrainingError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/sessoes', async (request, reply) => {
    const parsed = listFunctionalTrainingSessoesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatFunctionalTrainingValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdFunctionalTrainingPacienteScopeFromRequest(request)
      const result = await listFunctionalTrainingSessoes(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdFunctionalTrainingError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/estatisticas-semanais', async (request, reply) => {
    const parsed = estatisticasSemanaisQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatFunctionalTrainingValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdFunctionalTrainingPacienteScopeFromRequest(request)
      const stats = await getFunctionalTrainingEstatisticasSemanais(scope, {
        weekStartIso: parsed.data.weekStartIso,
      })
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(stats)
    } catch (error) {
      const mapped = mapVdFunctionalTrainingError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

import type { FastifyInstance } from 'fastify'
import type { AuthenticatedVdUser } from '../vd-auth/middleware.js'
import { requireVdAuth } from '../vd-auth/middleware.js'
import { mapVdSleepTimeError } from './errors.js'
import { SLEEP_TIME_CREATE_REGISTRO_RATE_LIMIT } from './rate-limits.js'
import { getVdSleepTimePacienteScopeFromRequest } from './scope.js'
import {
  createSleepTimeRegistroBodySchema,
  formatSleepTimeValidationError,
  listSleepTimeRegistrosQuerySchema,
  sleepTimeRegistroIdParamsSchema,
} from './schemas.js'
import {
  deleteSleepTimeRegistro,
  listSleepTimeRegistros,
  registerSleepTimeRegistro,
} from './service.js'
import { SLEEP_TIME_E2E_TEST_VD_USER } from './testing/e2eTestVdUser.js'

export type RegisterVdSleepTimeRoutesOptions = {
  /** Apenas testes — injeta `request.vdUser` antes de chamar os handlers. */
  skipAuth?: boolean
  /** Usuário VD usado quando `skipAuth` é verdadeiro. */
  testVdUser?: AuthenticatedVdUser
}

export async function registerVdSleepTimeRoutes(
  app: FastifyInstance,
  options: RegisterVdSleepTimeRoutesOptions = {},
): Promise<void> {
  if (!options.skipAuth) {
    app.addHook('preHandler', requireVdAuth)
  } else {
    app.addHook('preHandler', async (request) => {
      request.vdUser = options.testVdUser ?? SLEEP_TIME_E2E_TEST_VD_USER
    })
  }

  app.post('/registros', { config: SLEEP_TIME_CREATE_REGISTRO_RATE_LIMIT }, async (request, reply) => {
    const parsed = createSleepTimeRegistroBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatSleepTimeValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdSleepTimePacienteScopeFromRequest(request)
      const result = await registerSleepTimeRegistro(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.status(result.created ? 201 : 200).send({ registro: result.registro })
    } catch (error) {
      const mapped = mapVdSleepTimeError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/registros', async (request, reply) => {
    const parsed = listSleepTimeRegistrosQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatSleepTimeValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdSleepTimePacienteScopeFromRequest(request)
      const result = await listSleepTimeRegistros(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdSleepTimeError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/registros/:id', async (request, reply) => {
    const parsed = sleepTimeRegistroIdParamsSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatSleepTimeValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdSleepTimePacienteScopeFromRequest(request)
      const registro = await deleteSleepTimeRegistro(scope, parsed.data.id)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send({ registro })
    } catch (error) {
      const mapped = mapVdSleepTimeError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

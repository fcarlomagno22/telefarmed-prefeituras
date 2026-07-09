import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import rateLimit from '@fastify/rate-limit'
import Fastify from 'fastify'
import { FUNCTIONAL_TRAINING_CREATE_SESSAO_RATE_LIMIT } from './rate-limits.js'
import { registerVdFunctionalTrainingRoutes } from './routes.js'
import {
  __resetFunctionalTrainingServiceDepsForTests,
  __setFunctionalTrainingServiceDepsForTests,
} from './service.js'
import { createInMemoryFunctionalTrainingDeps } from './testing/inMemoryFunctionalTrainingDeps.js'

const PREFIX = '/api/v1/vd/functional-training'

const E2E_SESSAO_PAYLOAD = {
  clientSessionId: 'client-session-e2e-00001',
  mode: 'single',
  durationSec: 30,
  totalActiveSec: 28,
  exerciseIds: ['abdominal-reverso', 'afundo'],
  completedAt: '2026-07-08T10:30:00.000-03:00',
} as const

async function buildFunctionalTrainingTestApp(options: { skipAuth?: boolean } = {}) {
  const app = Fastify()
  await app.register(rateLimit, { global: false })
  await app.register(
    async (instance) => {
      await registerVdFunctionalTrainingRoutes(instance, { skipAuth: options.skipAuth ?? false })
    },
    { prefix: PREFIX },
  )
  return app
}

describe('registerVdFunctionalTrainingRoutes', () => {
  it('registra rotas autenticadas', async () => {
    const app = Fastify()

    await app.register(
      async (instance) => {
        await registerVdFunctionalTrainingRoutes(instance)
      },
      { prefix: PREFIX },
    )

    const routes = app.printRoutes({ commonPrefix: false })
    assert.match(routes, /\/favoritos/)
    assert.match(routes, /\/sessoes/)
    assert.match(routes, /\/estatisticas-semanais/)

    const favoritosGet = await app.inject({ method: 'GET', url: `${PREFIX}/favoritos` })
    assert.equal(favoritosGet.statusCode, 401)

    const favoritosPut = await app.inject({
      method: 'PUT',
      url: `${PREFIX}/favoritos/afundo`,
    })
    assert.equal(favoritosPut.statusCode, 401)

    const favoritosDelete = await app.inject({
      method: 'DELETE',
      url: `${PREFIX}/favoritos/afundo`,
    })
    assert.equal(favoritosDelete.statusCode, 401)

    const sessoesPost = await app.inject({
      method: 'POST',
      url: `${PREFIX}/sessoes`,
      payload: E2E_SESSAO_PAYLOAD,
    })
    assert.equal(sessoesPost.statusCode, 401)

    const sessoesGet = await app.inject({ method: 'GET', url: `${PREFIX}/sessoes` })
    assert.equal(sessoesGet.statusCode, 401)

    const statsGet = await app.inject({
      method: 'GET',
      url: `${PREFIX}/estatisticas-semanais`,
    })
    assert.equal(statsGet.statusCode, 401)

    await app.close()
  })
})

describe('vd-functional-training E2E (rotas + serviço em memória)', () => {
  let inMemory: ReturnType<typeof createInMemoryFunctionalTrainingDeps>

  before(() => {
    inMemory = createInMemoryFunctionalTrainingDeps()
    __setFunctionalTrainingServiceDepsForTests(inMemory.deps)
  })

  after(() => {
    __resetFunctionalTrainingServiceDepsForTests()
  })

  it('favoritar → listar → desfavoritar', async () => {
    const app = await buildFunctionalTrainingTestApp({ skipAuth: true })

    const emptyResponse = await app.inject({ method: 'GET', url: `${PREFIX}/favoritos` })
    assert.equal(emptyResponse.statusCode, 200)
    assert.deepEqual(emptyResponse.json(), { exerciseIds: [] })

    const addResponse = await app.inject({
      method: 'PUT',
      url: `${PREFIX}/favoritos/afundo`,
    })
    assert.equal(addResponse.statusCode, 200)
    assert.deepEqual(addResponse.json(), { exerciseIds: ['afundo'] })

    const listResponse = await app.inject({ method: 'GET', url: `${PREFIX}/favoritos` })
    assert.equal(listResponse.statusCode, 200)
    assert.deepEqual(listResponse.json(), { exerciseIds: ['afundo'] })

    const removeResponse = await app.inject({
      method: 'DELETE',
      url: `${PREFIX}/favoritos/afundo`,
    })
    assert.equal(removeResponse.statusCode, 200)
    assert.deepEqual(removeResponse.json(), { exerciseIds: [] })

    await app.close()
  })

  it('criar sessão → listar → estatísticas → idempotência', async () => {
    const app = await buildFunctionalTrainingTestApp({ skipAuth: true })

    const createResponse = await app.inject({
      method: 'POST',
      url: `${PREFIX}/sessoes`,
      payload: E2E_SESSAO_PAYLOAD,
    })
    assert.equal(createResponse.statusCode, 201)

    const createdBody = createResponse.json() as {
      session: { id: string; clientSessionId: string; exerciseIds: string[] }
    }
    assert.equal(createdBody.session.clientSessionId, E2E_SESSAO_PAYLOAD.clientSessionId)
    assert.deepEqual(createdBody.session.exerciseIds, E2E_SESSAO_PAYLOAD.exerciseIds)

    const listResponse = await app.inject({
      method: 'GET',
      url: `${PREFIX}/sessoes?page=1&pageSize=20`,
    })
    assert.equal(listResponse.statusCode, 200)

    const listBody = listResponse.json() as {
      sessions: Array<{ id: string }>
      totalCount: number
    }
    assert.equal(listBody.totalCount, 1)
    assert.equal(listBody.sessions[0]?.id, createdBody.session.id)

    const statsResponse = await app.inject({
      method: 'GET',
      url: `${PREFIX}/estatisticas-semanais?weekStartIso=2026-07-07T03:00:00.000Z`,
    })
    assert.equal(statsResponse.statusCode, 200)

    const statsBody = statsResponse.json() as {
      sessionsCount: number
      totalActiveMinutes: number
      uniqueExercises: number
    }
    assert.equal(statsBody.sessionsCount, 1)
    assert.equal(statsBody.totalActiveMinutes, 0)
    assert.equal(statsBody.uniqueExercises, 2)

    const idempotentResponse = await app.inject({
      method: 'POST',
      url: `${PREFIX}/sessoes`,
      payload: E2E_SESSAO_PAYLOAD,
    })
    assert.equal(idempotentResponse.statusCode, 200)
    assert.equal(inMemory.sessoes.length, 1)

    await app.close()
  })

  it('aplica rate limit em POST /sessoes', async () => {
    const app = await buildFunctionalTrainingTestApp({ skipAuth: true })
    const max = FUNCTIONAL_TRAINING_CREATE_SESSAO_RATE_LIMIT.rateLimit.max

    for (let index = 0; index < max; index += 1) {
      const response = await app.inject({
        method: 'POST',
        url: `${PREFIX}/sessoes`,
        payload: {
          ...E2E_SESSAO_PAYLOAD,
          clientSessionId: `client-session-rate-${String(index).padStart(4, '0')}`,
        },
      })
      assert.equal(response.statusCode, 201)
    }

    const blocked = await app.inject({
      method: 'POST',
      url: `${PREFIX}/sessoes`,
      payload: {
        ...E2E_SESSAO_PAYLOAD,
        clientSessionId: 'client-session-rate-blocked',
      },
    })
    assert.equal(blocked.statusCode, 429)

    await app.close()
  })

  it('rejeita exercício inválido em POST /sessoes', async () => {
    const app = await buildFunctionalTrainingTestApp({ skipAuth: true })

    const response = await app.inject({
      method: 'POST',
      url: `${PREFIX}/sessoes`,
      payload: {
        ...E2E_SESSAO_PAYLOAD,
        clientSessionId: 'client-session-invalid-exercise',
        exerciseIds: ['polichinelo'],
      },
    })

    assert.equal(response.statusCode, 400)
    await app.close()
  })
})

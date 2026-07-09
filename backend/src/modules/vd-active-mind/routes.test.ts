import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import rateLimit from '@fastify/rate-limit'
import Fastify from 'fastify'
import { ACTIVE_MIND_CREATE_SESSAO_RATE_LIMIT } from './rate-limits.js'
import { registerVdActiveMindRoutes } from './routes.js'
import {
  __resetActiveMindServiceDepsForTests,
  __setActiveMindServiceDepsForTests,
} from './service.js'
import { createInMemoryActiveMindDeps } from './testing/inMemoryActiveMindDeps.js'

const PREFIX = '/api/v1/vd/active-mind'

function recentCompletedAt(offsetMs = -60_000): string {
  return new Date(Date.now() + offsetMs).toISOString()
}

function buildE2eSessaoPayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    clientSessionId: 'active-mind-session-e2e-00001',
    gameId: 'sudoku',
    difficulty: 'facil',
    puzzleId: 'sudoku-facil-1',
    durationSec: 300,
    attempts: 10,
    correct: 8,
    errors: 2,
    reveals: 0,
    completedAt: recentCompletedAt(),
    ...overrides,
  }
}

async function buildActiveMindTestApp(options: { skipAuth?: boolean } = {}) {
  const app = Fastify()
  await app.register(rateLimit, { global: false })
  await app.register(
    async (instance) => {
      await registerVdActiveMindRoutes(instance, { skipAuth: options.skipAuth ?? false })
    },
    { prefix: PREFIX },
  )
  return app
}

describe('registerVdActiveMindRoutes', () => {
  it('registra rotas autenticadas', async () => {
    const app = Fastify()

    await app.register(
      async (instance) => {
        await registerVdActiveMindRoutes(instance)
      },
      { prefix: PREFIX },
    )

    const routes = app.printRoutes({ commonPrefix: false })
    assert.match(routes, /\/sessoes/)
    assert.match(routes, /\/estatisticas-semanais/)

    const sessoesPost = await app.inject({
      method: 'POST',
      url: `${PREFIX}/sessoes`,
      payload: buildE2eSessaoPayload(),
    })
    assert.equal(sessoesPost.statusCode, 401)

    const sessoesGet = await app.inject({ method: 'GET', url: `${PREFIX}/sessoes` })
    assert.equal(sessoesGet.statusCode, 401)

    const sessoesDelete = await app.inject({
      method: 'DELETE',
      url: `${PREFIX}/sessoes/11111111-1111-1111-1111-111111111111`,
    })
    assert.equal(sessoesDelete.statusCode, 401)

    const statsGet = await app.inject({
      method: 'GET',
      url: `${PREFIX}/estatisticas-semanais`,
    })
    assert.equal(statsGet.statusCode, 401)

    await app.close()
  })
})

describe('vd-active-mind E2E (rotas + serviço em memória)', () => {
  let inMemory: ReturnType<typeof createInMemoryActiveMindDeps>

  before(() => {
    inMemory = createInMemoryActiveMindDeps()
    __setActiveMindServiceDepsForTests(inMemory.deps)
  })

  after(() => {
    __resetActiveMindServiceDepsForTests()
  })

  it('criar sessão → listar → estatísticas → idempotência → soft delete', async () => {
    const app = await buildActiveMindTestApp({ skipAuth: true })

    const createResponse = await app.inject({
      method: 'POST',
      url: `${PREFIX}/sessoes`,
      payload: buildE2eSessaoPayload(),
    })
    assert.equal(createResponse.statusCode, 201)

    const createdBody = createResponse.json() as {
      session: { id: string; clientSessionId: string; gameId: string }
    }
    assert.equal(createdBody.session.clientSessionId, 'active-mind-session-e2e-00001')
    assert.equal(createdBody.session.gameId, 'sudoku')

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
      url: `${PREFIX}/estatisticas-semanais`,
    })
    assert.equal(statsResponse.statusCode, 200)

    const statsBody = statsResponse.json() as {
      totalSessions: number
      totalDurationSec: number
      byGame: Array<{ gameId: string; count: number }>
    }
    assert.equal(statsBody.totalSessions, 1)
    assert.equal(statsBody.totalDurationSec, 300)
    assert.equal(statsBody.byGame[0]?.gameId, 'sudoku')
    assert.equal(statsBody.byGame[0]?.count, 1)

    const idempotentResponse = await app.inject({
      method: 'POST',
      url: `${PREFIX}/sessoes`,
      payload: buildE2eSessaoPayload(),
    })
    assert.equal(idempotentResponse.statusCode, 200)
    assert.equal(inMemory.sessoes.length, 1)

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `${PREFIX}/sessoes/${createdBody.session.id}`,
    })
    assert.equal(deleteResponse.statusCode, 200)

    const listAfterDelete = await app.inject({
      method: 'GET',
      url: `${PREFIX}/sessoes?page=1&pageSize=20`,
    })
    const listAfterDeleteBody = listAfterDelete.json() as { totalCount: number }
    assert.equal(listAfterDeleteBody.totalCount, 0)

    await app.close()
  })

  it('aplica rate limit em POST /sessoes', async () => {
    const app = await buildActiveMindTestApp({ skipAuth: true })
    const max = ACTIVE_MIND_CREATE_SESSAO_RATE_LIMIT.rateLimit.max

    for (let index = 0; index < max; index += 1) {
      const response = await app.inject({
        method: 'POST',
        url: `${PREFIX}/sessoes`,
        payload: buildE2eSessaoPayload({
          clientSessionId: `active-mind-session-rate-${String(index).padStart(4, '0')}`,
        }),
      })
      assert.equal(response.statusCode, 201)
    }

    const blocked = await app.inject({
      method: 'POST',
      url: `${PREFIX}/sessoes`,
      payload: buildE2eSessaoPayload({
        clientSessionId: 'active-mind-session-rate-blocked',
      }),
    })
    assert.equal(blocked.statusCode, 429)

    await app.close()
  })

  it('rejeita gameId inválido em POST /sessoes', async () => {
    const app = await buildActiveMindTestApp({ skipAuth: true })

    const response = await app.inject({
      method: 'POST',
      url: `${PREFIX}/sessoes`,
      payload: buildE2eSessaoPayload({
        clientSessionId: 'active-mind-session-invalid-game',
        gameId: 'tetris',
      }),
    })

    assert.equal(response.statusCode, 400)
    await app.close()
  })

  it('retorna 404 ao deletar sessão inexistente', async () => {
    const app = await buildActiveMindTestApp({ skipAuth: true })

    const response = await app.inject({
      method: 'DELETE',
      url: `${PREFIX}/sessoes/33333333-3333-3333-3333-333333333333`,
    })

    assert.equal(response.statusCode, 404)
    await app.close()
  })

  it('pagina resultados e filtra por gameId', async () => {
    inMemory.sessoes.length = 0
    const app = await buildActiveMindTestApp({ skipAuth: true })
    const baseMs = Date.now() - 120_000

    for (let index = 0; index < 3; index += 1) {
      const createResponse = await app.inject({
        method: 'POST',
        url: `${PREFIX}/sessoes`,
        payload: buildE2eSessaoPayload({
          clientSessionId: `active-mind-session-page-${String(index).padStart(4, '0')}`,
          gameId: index === 2 ? 'crosswords' : 'sudoku',
          completedAt: new Date(baseMs + index * 1_000).toISOString(),
        }),
      })
      assert.equal(createResponse.statusCode, 201)
    }

    const pageOne = await app.inject({
      method: 'GET',
      url: `${PREFIX}/sessoes?page=1&pageSize=2&gameId=sudoku`,
    })
    assert.equal(pageOne.statusCode, 200)

    const pageOneBody = pageOne.json() as {
      sessions: Array<{ gameId: string }>
      totalCount: number
      hasMore: boolean
      page: number
      pageSize: number
    }
    assert.equal(pageOneBody.totalCount, 2)
    assert.equal(pageOneBody.page, 1)
    assert.equal(pageOneBody.pageSize, 2)
    assert.equal(pageOneBody.hasMore, false)
    assert.equal(pageOneBody.sessions.length, 2)
    assert.ok(pageOneBody.sessions.every((session) => session.gameId === 'sudoku'))

    const pageAll = await app.inject({
      method: 'GET',
      url: `${PREFIX}/sessoes?page=1&pageSize=2`,
    })
    const pageAllBody = pageAll.json() as {
      totalCount: number
      hasMore: boolean
      sessions: Array<{ id: string }>
    }
    assert.equal(pageAllBody.totalCount, 3)
    assert.equal(pageAllBody.hasMore, true)
    assert.equal(pageAllBody.sessions.length, 2)

    const pageTwo = await app.inject({
      method: 'GET',
      url: `${PREFIX}/sessoes?page=2&pageSize=2`,
    })
    const pageTwoBody = pageTwo.json() as {
      hasMore: boolean
      sessions: Array<{ id: string }>
    }
    assert.equal(pageTwoBody.hasMore, false)
    assert.equal(pageTwoBody.sessions.length, 1)

    await app.close()
  })

  it('retorna 409 ao reenviar clientSessionId de sessão soft-deleted', async () => {
    const app = await buildActiveMindTestApp({ skipAuth: true })
    const payload = buildE2eSessaoPayload({
      clientSessionId: 'active-mind-session-soft-deleted',
    })

    const createResponse = await app.inject({
      method: 'POST',
      url: `${PREFIX}/sessoes`,
      payload,
    })
    assert.equal(createResponse.statusCode, 201)

    const createdBody = createResponse.json() as { session: { id: string } }
    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `${PREFIX}/sessoes/${createdBody.session.id}`,
    })
    assert.equal(deleteResponse.statusCode, 200)

    const replayResponse = await app.inject({
      method: 'POST',
      url: `${PREFIX}/sessoes`,
      payload,
    })
    assert.equal(replayResponse.statusCode, 409)

    await app.close()
  })
})

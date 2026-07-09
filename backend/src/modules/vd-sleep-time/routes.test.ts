import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import rateLimit from '@fastify/rate-limit'
import Fastify from 'fastify'
import { SLEEP_TIME_CREATE_REGISTRO_RATE_LIMIT } from './rate-limits.js'
import { registerVdSleepTimeRoutes } from './routes.js'
import {
  __resetSleepTimeServiceDepsForTests,
  __setSleepTimeServiceDepsForTests,
} from './service.js'
import { createInMemorySleepTimeDeps } from './testing/inMemorySleepTimeDeps.js'
import {
  SLEEP_TIME_E2E_OTHER_VD_USER,
  SLEEP_TIME_E2E_TEST_VD_USER,
} from './testing/e2eTestVdUser.js'
import type { AuthenticatedVdUser } from '../vd-auth/middleware.js'

const PREFIX = '/api/v1/vd/sleep-time'

const E2E_REGISTRO_PAYLOAD = {
  clientLogId: 'client-log-e2e-00001',
  bedAt: '2026-07-08T22:30:00.000-03:00',
  wakeAt: '2026-07-09T07:00:00.000-03:00',
  quality: 4,
  wakeCount: 1,
  notes: 'Noite tranquila',
} as const

async function buildSleepTimeTestApp(
  options: { skipAuth?: boolean; testVdUser?: AuthenticatedVdUser } = {},
) {
  const app = Fastify()
  await app.register(rateLimit, { global: false })
  await app.register(
    async (instance) => {
      await registerVdSleepTimeRoutes(instance, {
        skipAuth: options.skipAuth ?? false,
        testVdUser: options.testVdUser,
      })
    },
    { prefix: PREFIX },
  )
  return app
}

function useFreshInMemoryDeps() {
  const inMemory = createInMemorySleepTimeDeps()
  __setSleepTimeServiceDepsForTests(inMemory.deps)
  return inMemory
}

describe('registerVdSleepTimeRoutes', () => {
  it('registra rotas autenticadas', async () => {
    const app = Fastify()

    await app.register(
      async (instance) => {
        await registerVdSleepTimeRoutes(instance)
      },
      { prefix: PREFIX },
    )

    const routes = app.printRoutes({ commonPrefix: false })
    assert.match(routes, /\/registros/)

    const registrosPost = await app.inject({
      method: 'POST',
      url: `${PREFIX}/registros`,
      payload: E2E_REGISTRO_PAYLOAD,
    })
    assert.equal(registrosPost.statusCode, 401)

    const registrosGet = await app.inject({ method: 'GET', url: `${PREFIX}/registros` })
    assert.equal(registrosGet.statusCode, 401)

    const registrosDelete = await app.inject({
      method: 'DELETE',
      url: `${PREFIX}/registros/11111111-1111-1111-1111-111111111111`,
    })
    assert.equal(registrosDelete.statusCode, 401)

    await app.close()
  })
})

describe('vd-sleep-time E2E (rotas + serviço em memória)', () => {
  let inMemory: ReturnType<typeof createInMemorySleepTimeDeps>

  before(() => {
    inMemory = createInMemorySleepTimeDeps()
    __setSleepTimeServiceDepsForTests(inMemory.deps)
  })

  after(() => {
    __resetSleepTimeServiceDepsForTests()
  })

  it('criar registro → listar → idempotência → soft delete', async () => {
    const app = await buildSleepTimeTestApp({ skipAuth: true })

    const createResponse = await app.inject({
      method: 'POST',
      url: `${PREFIX}/registros`,
      payload: E2E_REGISTRO_PAYLOAD,
    })
    assert.equal(createResponse.statusCode, 201)

    const createdBody = createResponse.json() as {
      registro: { id: string; clientLogId: string; durationMinutes: number }
    }
    assert.equal(createdBody.registro.clientLogId, E2E_REGISTRO_PAYLOAD.clientLogId)
    assert.equal(createdBody.registro.durationMinutes, 510)

    const listResponse = await app.inject({
      method: 'GET',
      url: `${PREFIX}/registros?page=1&pageSize=20`,
    })
    assert.equal(listResponse.statusCode, 200)

    const listBody = listResponse.json() as {
      registros: Array<{ id: string }>
      totalCount: number
    }
    assert.equal(listBody.totalCount, 1)
    assert.equal(listBody.registros[0]?.id, createdBody.registro.id)

    const idempotentResponse = await app.inject({
      method: 'POST',
      url: `${PREFIX}/registros`,
      payload: E2E_REGISTRO_PAYLOAD,
    })
    assert.equal(idempotentResponse.statusCode, 200)
    assert.equal(inMemory.registros.length, 1)

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `${PREFIX}/registros/${createdBody.registro.id}`,
    })
    assert.equal(deleteResponse.statusCode, 200)

    const listAfterDelete = await app.inject({
      method: 'GET',
      url: `${PREFIX}/registros?page=1&pageSize=20`,
    })
    const listAfterDeleteBody = listAfterDelete.json() as { totalCount: number }
    assert.equal(listAfterDeleteBody.totalCount, 0)

    await app.close()
  })

  it('aplica rate limit em POST /registros', async () => {
    const app = await buildSleepTimeTestApp({ skipAuth: true })
    const max = SLEEP_TIME_CREATE_REGISTRO_RATE_LIMIT.rateLimit.max

    for (let index = 0; index < max; index += 1) {
      const response = await app.inject({
        method: 'POST',
        url: `${PREFIX}/registros`,
        payload: {
          ...E2E_REGISTRO_PAYLOAD,
          clientLogId: `client-log-rate-${String(index).padStart(4, '0')}`,
        },
      })
      assert.equal(response.statusCode, 201)
    }

    const blocked = await app.inject({
      method: 'POST',
      url: `${PREFIX}/registros`,
      payload: {
        ...E2E_REGISTRO_PAYLOAD,
        clientLogId: 'client-log-rate-blocked',
      },
    })
    assert.equal(blocked.statusCode, 429)

    await app.close()
  })

  it('rejeita payload inválido em POST /registros', async () => {
    const app = await buildSleepTimeTestApp({ skipAuth: true })

    const response = await app.inject({
      method: 'POST',
      url: `${PREFIX}/registros`,
      payload: {
        ...E2E_REGISTRO_PAYLOAD,
        clientLogId: 'client-log-invalid-quality',
        quality: 0,
      },
    })

    assert.equal(response.statusCode, 400)
    await app.close()
  })

  it('retorna 404 ao deletar registro inexistente', async () => {
    const app = await buildSleepTimeTestApp({ skipAuth: true })

    const response = await app.inject({
      method: 'DELETE',
      url: `${PREFIX}/registros/33333333-3333-3333-3333-333333333333`,
    })

    assert.equal(response.statusCode, 404)
    await app.close()
  })
})

describe('vd-sleep-time validação Zod via HTTP', () => {
  after(() => {
    __resetSleepTimeServiceDepsForTests()
  })

  it('rejeita wakeAt no futuro', async () => {
    useFreshInMemoryDeps()
    const app = await buildSleepTimeTestApp({ skipAuth: true })

    const response = await app.inject({
      method: 'POST',
      url: `${PREFIX}/registros`,
      payload: {
        ...E2E_REGISTRO_PAYLOAD,
        clientLogId: 'client-log-future-date',
        bedAt: '2099-01-01T22:00:00.000-03:00',
        wakeAt: '2099-01-02T07:00:00.000-03:00',
      },
    })

    assert.equal(response.statusCode, 400)
    const body = response.json() as { error: string }
    assert.match(body.error, /futura/i)
    await app.close()
  })

  it('rejeita wakeCount acima de 20', async () => {
    useFreshInMemoryDeps()
    const app = await buildSleepTimeTestApp({ skipAuth: true })

    const response = await app.inject({
      method: 'POST',
      url: `${PREFIX}/registros`,
      payload: {
        ...E2E_REGISTRO_PAYLOAD,
        clientLogId: 'client-log-wake-count-high',
        wakeCount: 21,
      },
    })

    assert.equal(response.statusCode, 400)
    await app.close()
  })
})

describe('vd-sleep-time idempotência client_log_id', () => {
  after(() => {
    __resetSleepTimeServiceDepsForTests()
  })

  it('retorna 200 com mesmo registro ao reenviar mesmo clientLogId', async () => {
    const inMemory = useFreshInMemoryDeps()
    const app = await buildSleepTimeTestApp({ skipAuth: true })

    const first = await app.inject({
      method: 'POST',
      url: `${PREFIX}/registros`,
      payload: {
        ...E2E_REGISTRO_PAYLOAD,
        clientLogId: 'client-log-idempotent-01',
      },
    })
    assert.equal(first.statusCode, 201)

    const firstBody = first.json() as { registro: { id: string; clientLogId: string } }

    const second = await app.inject({
      method: 'POST',
      url: `${PREFIX}/registros`,
      payload: {
        ...E2E_REGISTRO_PAYLOAD,
        clientLogId: 'client-log-idempotent-01',
        quality: 2,
        wakeCount: 5,
      },
    })
    assert.equal(second.statusCode, 200)

    const secondBody = second.json() as { registro: { id: string; clientLogId: string; quality: number } }
    assert.equal(secondBody.registro.id, firstBody.registro.id)
    assert.equal(secondBody.registro.clientLogId, firstBody.registro.clientLogId)
    assert.equal(secondBody.registro.quality, 4)
    assert.equal(inMemory.registros.length, 1)

    await app.close()
  })

  it('permite mesmo clientLogId para pacientes diferentes', async () => {
    const inMemory = useFreshInMemoryDeps()
    const appA = await buildSleepTimeTestApp({
      skipAuth: true,
      testVdUser: SLEEP_TIME_E2E_TEST_VD_USER,
    })
    const appB = await buildSleepTimeTestApp({
      skipAuth: true,
      testVdUser: SLEEP_TIME_E2E_OTHER_VD_USER,
    })

    const sharedClientLogId = 'client-log-shared-across-patients'

    const createA = await appA.inject({
      method: 'POST',
      url: `${PREFIX}/registros`,
      payload: { ...E2E_REGISTRO_PAYLOAD, clientLogId: sharedClientLogId },
    })
    assert.equal(createA.statusCode, 201)

    const createB = await appB.inject({
      method: 'POST',
      url: `${PREFIX}/registros`,
      payload: { ...E2E_REGISTRO_PAYLOAD, clientLogId: sharedClientLogId },
    })
    assert.equal(createB.statusCode, 201)

    const bodyA = createA.json() as { registro: { id: string } }
    const bodyB = createB.json() as { registro: { id: string } }
    assert.notEqual(bodyA.registro.id, bodyB.registro.id)
    assert.equal(inMemory.registros.length, 2)

    await appA.close()
    await appB.close()
  })
})

describe('vd-sleep-time isolamento por paciente', () => {
  after(() => {
    __resetSleepTimeServiceDepsForTests()
  })

  it('não lista nem deleta registros de outro paciente', async () => {
    useFreshInMemoryDeps()
    const appOwner = await buildSleepTimeTestApp({
      skipAuth: true,
      testVdUser: SLEEP_TIME_E2E_TEST_VD_USER,
    })
    const appOther = await buildSleepTimeTestApp({
      skipAuth: true,
      testVdUser: SLEEP_TIME_E2E_OTHER_VD_USER,
    })

    const createResponse = await appOwner.inject({
      method: 'POST',
      url: `${PREFIX}/registros`,
      payload: {
        ...E2E_REGISTRO_PAYLOAD,
        clientLogId: 'client-log-scope-isolation',
      },
    })
    assert.equal(createResponse.statusCode, 201)

    const created = createResponse.json() as { registro: { id: string } }

    const listOther = await appOther.inject({
      method: 'GET',
      url: `${PREFIX}/registros`,
    })
    assert.equal(listOther.statusCode, 200)
    const listOtherBody = listOther.json() as { totalCount: number; registros: unknown[] }
    assert.equal(listOtherBody.totalCount, 0)
    assert.equal(listOtherBody.registros.length, 0)

    const deleteOther = await appOther.inject({
      method: 'DELETE',
      url: `${PREFIX}/registros/${created.registro.id}`,
    })
    assert.equal(deleteOther.statusCode, 404)

    const listOwner = await appOwner.inject({
      method: 'GET',
      url: `${PREFIX}/registros`,
    })
    const listOwnerBody = listOwner.json() as { totalCount: number }
    assert.equal(listOwnerBody.totalCount, 1)

    await appOwner.close()
    await appOther.close()
  })
})

describe('vd-sleep-time paginação e filtro por intervalo', () => {
  after(() => {
    __resetSleepTimeServiceDepsForTests()
  })

  it('pagina resultados e filtra por startIso/endIso', async () => {
    useFreshInMemoryDeps()
    const app = await buildSleepTimeTestApp({ skipAuth: true })

    const payloads = [
      {
        clientLogId: 'client-log-page-0001',
        bedAt: '2026-07-01T22:00:00.000-03:00',
        wakeAt: '2026-07-02T07:00:00.000-03:00',
      },
      {
        clientLogId: 'client-log-page-0002',
        bedAt: '2026-07-04T22:00:00.000-03:00',
        wakeAt: '2026-07-05T07:00:00.000-03:00',
      },
      {
        clientLogId: 'client-log-page-0003',
        bedAt: '2026-07-07T22:00:00.000-03:00',
        wakeAt: '2026-07-08T07:00:00.000-03:00',
      },
    ] as const

    for (const payload of payloads) {
      const response = await app.inject({
        method: 'POST',
        url: `${PREFIX}/registros`,
        payload: {
          quality: 4,
          wakeCount: 0,
          notes: 'Teste paginação',
          ...payload,
        },
      })
      assert.equal(response.statusCode, 201)
    }

    const pageOne = await app.inject({
      method: 'GET',
      url: `${PREFIX}/registros?page=1&pageSize=2`,
    })
    assert.equal(pageOne.statusCode, 200)

    const pageOneBody = pageOne.json() as {
      registros: Array<{ clientLogId: string }>
      totalCount: number
      hasMore: boolean
      page: number
      pageSize: number
    }
    assert.equal(pageOneBody.totalCount, 3)
    assert.equal(pageOneBody.page, 1)
    assert.equal(pageOneBody.pageSize, 2)
    assert.equal(pageOneBody.hasMore, true)
    assert.equal(pageOneBody.registros.length, 2)
    assert.equal(pageOneBody.registros[0]?.clientLogId, 'client-log-page-0003')

    const pageTwo = await app.inject({
      method: 'GET',
      url: `${PREFIX}/registros?page=2&pageSize=2`,
    })
    const pageTwoBody = pageTwo.json() as {
      registros: Array<{ clientLogId: string }>
      hasMore: boolean
    }
    assert.equal(pageTwoBody.registros.length, 1)
    assert.equal(pageTwoBody.registros[0]?.clientLogId, 'client-log-page-0001')
    assert.equal(pageTwoBody.hasMore, false)

    const filtered = await app.inject({
      method: 'GET',
      url: `${PREFIX}/registros?startIso=2026-07-04T00:00:00.000-03:00&endIso=2026-07-08T23:59:59.999-03:00`,
    })
    const filteredBody = filtered.json() as {
      totalCount: number
      registros: Array<{ clientLogId: string }>
    }
    assert.equal(filteredBody.totalCount, 2)
    assert.deepEqual(
      filteredBody.registros.map((item) => item.clientLogId).sort(),
      ['client-log-page-0002', 'client-log-page-0003'],
    )

    await app.close()
  })
})

import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import rateLimit from '@fastify/rate-limit'
import Fastify from 'fastify'
import { RUN_WALK_CREATE_ATIVIDADE_RATE_LIMIT } from './rate-limits.js'
import { registerVdRunWalkRoutes } from './routes.js'
import {
  __resetRunWalkCoreServiceDepsForTests,
  __setRunWalkCoreServiceDepsForTests,
} from './service.js'
import { createInMemoryRunWalkCoreDeps } from './testing/inMemoryRunWalkCoreDeps.js'

const E2E_ATIVIDADE_PAYLOAD = {
  clientActivityId: 'client-activity-e2e-00001',
  modality: 'walk',
  activityName: 'Caminhada E2E',
  elapsedSeconds: 1800,
  distanceKm: 2.5,
  paceMinPerKm: 12,
  stepCount: 3200,
  heartRateBpm: 118,
  estimatedCalories: 180,
  activeMinutes: 30,
  completedAt: '2026-07-08T10:30:00.000-03:00',
  trail: [{ latitude: -23.55, longitude: -46.63, recordedAt: 1_720_431_000_000 }],
} as const

const RUN_WALK_PREFIX = '/api/v1/vd/run-walk'

async function buildRunWalkTestApp(options: { skipAuth?: boolean } = {}) {
  const app = Fastify()
  await app.register(rateLimit, { global: false })
  await app.register(
    async (instance) => {
      await registerVdRunWalkRoutes(instance, { skipAuth: options.skipAuth ?? false })
    },
    { prefix: RUN_WALK_PREFIX },
  )
  return app
}

describe('registerVdRunWalkRoutes', () => {
  it('registra rota autenticada de health', async () => {
    const app = Fastify()

    await app.register(
      async (instance) => {
        await registerVdRunWalkRoutes(instance)
      },
      { prefix: '/api/v1/vd/run-walk' },
    )

    const routes = app.printRoutes({ commonPrefix: false })
    assert.match(routes, /\/api\/v1\/vd\/run-walk\/health/)
    assert.match(routes, /\/api\/v1\/vd\/run-walk\/atividades/)
    assert.match(routes, /\/resumo \(GET/)
    assert.match(routes, /\/metas-semanais/)
    assert.match(routes, /\/progresso \(GET/)
    assert.match(routes, /\/disposicao/)
    assert.match(routes, /\/checkin \(POST/)
    assert.match(routes, /\/checkin \(PATCH/)
    assert.match(routes, /\/plano\/hoje/)
    assert.match(routes, /\/live-sessoes/)
    assert.match(routes, /\/contatos-confianca/)
    assert.match(routes, /\/locais/)
    assert.match(routes, /\/integracoes\/leituras-tempo-real/)
    assert.match(routes, /\/preparacao\/rascunho/)
    assert.match(routes, /\/voto \(POST/)
    assert.match(routes, /\/comentarios/)
    assert.match(routes, /\/capa-upload-url \(POST/)
    assert.match(routes, /\/ativar-sos \(PATCH/)
    assert.match(routes, /\/encerrar \(PATCH/)
    assert.match(routes, /\/acoes \(POST/)
    assert.match(routes, /GET/)
    assert.match(routes, /PUT/)
    assert.match(routes, /POST/)
    assert.match(routes, /PATCH/)
    assert.match(routes, /DELETE/)

    const atividadesGet = await app.inject({
      method: 'GET',
      url: '/api/v1/vd/run-walk/atividades?period=30d&page=1&pageSize=20',
    })
    assert.equal(atividadesGet.statusCode, 401)

    const atividadesResumo = await app.inject({
      method: 'GET',
      url: '/api/v1/vd/run-walk/atividades/resumo?period=30d',
    })
    assert.equal(atividadesResumo.statusCode, 401)

    const atividadeById = await app.inject({
      method: 'GET',
      url: '/api/v1/vd/run-walk/atividades/11111111-1111-1111-1111-111111111111',
    })
    assert.equal(atividadeById.statusCode, 401)

    const atividadeCheckinPatch = await app.inject({
      method: 'PATCH',
      url: '/api/v1/vd/run-walk/atividades/11111111-1111-1111-1111-111111111111/checkin',
      payload: { checkInSkipped: true },
    })
    assert.equal(atividadeCheckinPatch.statusCode, 401)

    const atividadeDelete = await app.inject({
      method: 'DELETE',
      url: '/api/v1/vd/run-walk/atividades/11111111-1111-1111-1111-111111111111',
    })
    assert.equal(atividadeDelete.statusCode, 401)

    const health = await app.inject({ method: 'GET', url: '/api/v1/vd/run-walk/health' })
    assert.equal(health.statusCode, 401)

    const atividadesPost = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/run-walk/atividades',
      payload: {
        clientActivityId: 'client-activity-12345678',
        modality: 'walk',
        activityName: 'Caminhada leve',
        elapsedSeconds: 1800,
        distanceKm: 2.5,
        stepCount: 3200,
        heartRateBpm: 118,
        estimatedCalories: 180,
        activeMinutes: 30,
        completedAt: '2026-07-08T10:30:00.000-03:00',
        trail: [{ latitude: -23.55, longitude: -46.63, recordedAt: 1_720_431_000_000 }],
      },
    })
    assert.equal(atividadesPost.statusCode, 401)

    const metasGet = await app.inject({
      method: 'GET',
      url: '/api/v1/vd/run-walk/metas-semanais',
    })
    assert.equal(metasGet.statusCode, 401)

    const metasPut = await app.inject({
      method: 'PUT',
      url: '/api/v1/vd/run-walk/metas-semanais',
      payload: {
        targetActivities: 4,
        targetActiveMinutes: 150,
        targetMovementDays: 5,
      },
    })
    assert.equal(metasPut.statusCode, 401)

    const metasProgresso = await app.inject({
      method: 'GET',
      url: '/api/v1/vd/run-walk/metas-semanais/progresso',
    })
    assert.equal(metasProgresso.statusCode, 401)

    const disposicao = await app.inject({
      method: 'GET',
      url: '/api/v1/vd/run-walk/disposicao',
    })
    assert.equal(disposicao.statusCode, 401)

    const disposicaoCheckin = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/run-walk/disposicao/checkin',
      payload: {
        mood: 'good',
        sleptWell: true,
      },
    })
    assert.equal(disposicaoCheckin.statusCode, 401)

    const planoHoje = await app.inject({
      method: 'GET',
      url: '/api/v1/vd/run-walk/plano/hoje',
    })
    assert.equal(planoHoje.statusCode, 401)

    const planoHojePut = await app.inject({
      method: 'PUT',
      url: '/api/v1/vd/run-walk/plano/hoje',
      payload: { presetId: 'light-walk' },
    })
    assert.equal(planoHojePut.statusCode, 401)

    const planoHojeAcao = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/run-walk/plano/hoje/acoes',
      payload: { action: 'skip' },
    })
    assert.equal(planoHojeAcao.statusCode, 401)

    const liveSessaoPost = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/run-walk/live-sessoes',
      payload: {
        participantName: 'Maria',
        activityName: 'Caminhada',
      },
    })
    assert.equal(liveSessaoPost.statusCode, 401)

    const liveSessaoPontos = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/run-walk/live-sessoes/11111111-1111-1111-1111-111111111111/pontos',
      payload: {
        points: [{ latitude: -23.55, longitude: -46.63 }],
      },
    })
    assert.equal(liveSessaoPontos.statusCode, 401)

    const liveSessaoEncerrar = await app.inject({
      method: 'PATCH',
      url: '/api/v1/vd/run-walk/live-sessoes/11111111-1111-1111-1111-111111111111/encerrar',
    })
    assert.equal(liveSessaoEncerrar.statusCode, 401)

    const contatosGet = await app.inject({
      method: 'GET',
      url: '/api/v1/vd/run-walk/contatos-confianca',
    })
    assert.equal(contatosGet.statusCode, 401)

    const contatosPost = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/run-walk/contatos-confianca',
      payload: {
        clientContactId: 'contact-local-123456',
        name: 'Maria',
        phone: '(11) 98888-7777',
      },
    })
    assert.equal(contatosPost.statusCode, 401)

    const contatosPut = await app.inject({
      method: 'PUT',
      url: '/api/v1/vd/run-walk/contatos-confianca/11111111-1111-1111-1111-111111111111',
      payload: { name: 'Maria Atualizada' },
    })
    assert.equal(contatosPut.statusCode, 401)

    const contatosDelete = await app.inject({
      method: 'DELETE',
      url: '/api/v1/vd/run-walk/contatos-confianca/11111111-1111-1111-1111-111111111111',
    })
    assert.equal(contatosDelete.statusCode, 401)

    const contatosAtivarSos = await app.inject({
      method: 'PATCH',
      url: '/api/v1/vd/run-walk/contatos-confianca/11111111-1111-1111-1111-111111111111/ativar-sos',
    })
    assert.equal(contatosAtivarSos.statusCode, 401)

    const locaisGet = await app.inject({
      method: 'GET',
      url: '/api/v1/vd/run-walk/locais?latitude=-23.55&longitude=-46.63&radiusKm=20',
    })
    assert.equal(locaisGet.statusCode, 401)

    const locaisCapaUpload = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/run-walk/locais/capa-upload-url',
    })
    assert.equal(locaisCapaUpload.statusCode, 401)

    const locaisPost = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/run-walk/locais',
      payload: {
        name: 'Parque Novo',
        description: 'Local seguro com iluminação e pista larga.',
        type: 'park',
        latitude: -23.55,
        longitude: -46.63,
        addressLabel: 'Rua A, 100',
        locationSource: 'gps',
        coverPhotoStoragePath: 'ent-1/pac-1/cover.jpg',
      },
    })
    assert.equal(locaisPost.statusCode, 401)

    const localVoto = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/run-walk/locais/11111111-1111-1111-1111-111111111111/voto',
      payload: { vote: 'recommend' },
    })
    assert.equal(localVoto.statusCode, 401)

    const localComentariosGet = await app.inject({
      method: 'GET',
      url: '/api/v1/vd/run-walk/locais/11111111-1111-1111-1111-111111111111/comentarios',
    })
    assert.equal(localComentariosGet.statusCode, 401)

    const localComentariosPost = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/run-walk/locais/11111111-1111-1111-1111-111111111111/comentarios',
      payload: { text: 'Ótimo local' },
    })
    assert.equal(localComentariosPost.statusCode, 401)

    const integracoesLeituras = await app.inject({
      method: 'GET',
      url: '/api/v1/vd/run-walk/integracoes/leituras-tempo-real?sessionStartedAt=2026-07-08T10:00:00.000-03:00',
    })
    assert.equal(integracoesLeituras.statusCode, 401)

    const preparacaoRascunhoGet = await app.inject({
      method: 'GET',
      url: '/api/v1/vd/run-walk/preparacao/rascunho',
    })
    assert.equal(preparacaoRascunhoGet.statusCode, 401)

    const preparacaoRascunhoPut = await app.inject({
      method: 'PUT',
      url: '/api/v1/vd/run-walk/preparacao/rascunho',
      payload: {
        modality: 'walk',
        activityName: 'Caminhada',
        intensity: 'Leve',
        durationMinutes: 30,
        audioConfigured: false,
      },
    })
    assert.equal(preparacaoRascunhoPut.statusCode, 401)

    const preparacaoRascunhoDelete = await app.inject({
      method: 'DELETE',
      url: '/api/v1/vd/run-walk/preparacao/rascunho',
    })
    assert.equal(preparacaoRascunhoDelete.statusCode, 401)

    await app.close()
  })
})

describe('vd-run-walk E2E (rotas + serviço em memória)', () => {
  let inMemory: ReturnType<typeof createInMemoryRunWalkCoreDeps>

  before(() => {
    inMemory = createInMemoryRunWalkCoreDeps()
    __setRunWalkCoreServiceDepsForTests(inMemory.deps)
  })

  after(() => {
    __resetRunWalkCoreServiceDepsForTests()
  })

  it('criar atividade → listar → resumo → sync métricas', async () => {
    const app = await buildRunWalkTestApp({ skipAuth: true })

    const createResponse = await app.inject({
      method: 'POST',
      url: `${RUN_WALK_PREFIX}/atividades`,
      payload: E2E_ATIVIDADE_PAYLOAD,
    })
    assert.equal(createResponse.statusCode, 201)

    const createdBody = createResponse.json() as {
      activity: { id: string; clientActivityId: string; distanceKm: number }
    }
    assert.equal(createdBody.activity.clientActivityId, E2E_ATIVIDADE_PAYLOAD.clientActivityId)
    assert.equal(createdBody.activity.distanceKm, E2E_ATIVIDADE_PAYLOAD.distanceKm)

    const listResponse = await app.inject({
      method: 'GET',
      url: `${RUN_WALK_PREFIX}/atividades?period=30d&page=1&pageSize=20`,
    })
    assert.equal(listResponse.statusCode, 200)

    const listBody = listResponse.json() as {
      activities: Array<{ id: string; clientActivityId: string }>
      totalCount: number
    }
    assert.equal(listBody.totalCount, 1)
    assert.equal(listBody.activities[0]?.id, createdBody.activity.id)

    const resumoResponse = await app.inject({
      method: 'GET',
      url: `${RUN_WALK_PREFIX}/atividades/resumo?period=30d`,
    })
    assert.equal(resumoResponse.statusCode, 200)

    const resumoBody = resumoResponse.json() as {
      periodSummary: {
        totalWorkouts: number
        totalDistanceKm: number
        totalActiveMinutes: number
      }
    }
    assert.equal(resumoBody.periodSummary.totalWorkouts, 1)
    assert.equal(resumoBody.periodSummary.totalDistanceKm, E2E_ATIVIDADE_PAYLOAD.distanceKm)
    assert.equal(resumoBody.periodSummary.totalActiveMinutes, E2E_ATIVIDADE_PAYLOAD.activeMinutes)

    assert.equal(inMemory.metricasInserts.length, 1)
    const metricasInsert = inMemory.metricasInserts[0]!
    assert.equal(metricasInsert.steps, E2E_ATIVIDADE_PAYLOAD.stepCount)
    assert.equal(metricasInsert.kind, 'caminhada')
    assert.equal(metricasInsert.runWalkActivityId, createdBody.activity.id)

    const idempotentResponse = await app.inject({
      method: 'POST',
      url: `${RUN_WALK_PREFIX}/atividades`,
      payload: E2E_ATIVIDADE_PAYLOAD,
    })
    assert.equal(idempotentResponse.statusCode, 200)
    assert.equal(inMemory.metricasInserts.length, 1)

    await app.close()
  })

  it('aplica rate limit em POST /atividades', async () => {
    const app = await buildRunWalkTestApp({ skipAuth: true })
    const max = RUN_WALK_CREATE_ATIVIDADE_RATE_LIMIT.rateLimit.max

    let lastStatus = 0
    for (let index = 0; index < max + 1; index += 1) {
      const response = await app.inject({
        method: 'POST',
        url: `${RUN_WALK_PREFIX}/atividades`,
        payload: {
          ...E2E_ATIVIDADE_PAYLOAD,
          clientActivityId: `client-activity-rate-${String(index).padStart(5, '0')}`,
        },
      })
      lastStatus = response.statusCode
    }

    assert.equal(lastStatus, 429)
    await app.close()
  })
})

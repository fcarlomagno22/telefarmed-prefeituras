import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import Fastify from 'fastify'
import { registerVdMetricasRoutes } from './routes.js'

describe('registerVdMetricasRoutes', () => {
  it('registra rotas autenticadas de perfil e resumo', async () => {
    const app = Fastify()

    await app.register(
      async (instance) => {
        await registerVdMetricasRoutes(instance)
      },
      { prefix: '/api/v1/vd/metricas' },
    )

    const routes = app.printRoutes({ commonPrefix: false })
    assert.match(routes, /\/api\/v1\/vd\/metricas\/perfil/)
    assert.match(routes, /\/api\/v1\/vd\/metricas\/peso/)
    assert.match(routes, /\/api\/v1\/vd\/metricas\/glicemia/)
    assert.match(routes, /\/api\/v1\/vd\/metricas\/pressao/)
    assert.match(routes, /\/api\/v1\/vd\/metricas\/hidratacao/)
    assert.match(routes, /\/api\/v1\/vd\/metricas\/medidas-corporais/)
    assert.match(routes, /\/api\/v1\/vd\/metricas\/frequencia-cardiaca/)
    assert.match(routes, /\/api\/v1\/vd\/metricas\/atividade/)
    assert.match(routes, /\/api\/v1\/vd\/metricas\/integracoes/)
    assert.match(routes, /GET/)
    assert.match(routes, /PUT/)
    assert.match(routes, /POST/)
    assert.match(routes, /\/api\/v1\/vd\/metricas\/resumo/)

    const pesoUltimo = await app.inject({ method: 'GET', url: '/api/v1/vd/metricas/peso/ultimo' })
    assert.equal(pesoUltimo.statusCode, 401)

    const peso = await app.inject({ method: 'GET', url: '/api/v1/vd/metricas/peso' })
    assert.equal(peso.statusCode, 401)

    const pesoPost = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/metricas/peso',
      payload: { weightKg: 78 },
    })
    assert.equal(pesoPost.statusCode, 401)

    const glicemia = await app.inject({ method: 'GET', url: '/api/v1/vd/metricas/glicemia' })
    assert.equal(glicemia.statusCode, 401)

    const glicemiaPost = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/metricas/glicemia',
      payload: { amountMg: 92, context: 'fasting' },
    })
    assert.equal(glicemiaPost.statusCode, 401)

    const glicemiaDelete = await app.inject({
      method: 'DELETE',
      url: '/api/v1/vd/metricas/glicemia/11111111-1111-1111-1111-111111111111',
    })
    assert.equal(glicemiaDelete.statusCode, 401)

    const pressao = await app.inject({ method: 'GET', url: '/api/v1/vd/metricas/pressao' })
    assert.equal(pressao.statusCode, 401)

    const pressaoPost = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/metricas/pressao',
      payload: { systolic: 120, diastolic: 80 },
    })
    assert.equal(pressaoPost.statusCode, 401)

    const hidratacao = await app.inject({ method: 'GET', url: '/api/v1/vd/metricas/hidratacao' })
    assert.equal(hidratacao.statusCode, 401)

    const hidratacaoPost = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/metricas/hidratacao',
      payload: { amountMl: 250 },
    })
    assert.equal(hidratacaoPost.statusCode, 401)

    const medidasCorporais = await app.inject({
      method: 'GET',
      url: '/api/v1/vd/metricas/medidas-corporais',
    })
    assert.equal(medidasCorporais.statusCode, 401)

    const medidasCorporaisPost = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/metricas/medidas-corporais',
      payload: { measurementId: 'abdomen', valueCm: 92 },
    })
    assert.equal(medidasCorporaisPost.statusCode, 401)

    const frequenciaCardiaca = await app.inject({
      method: 'GET',
      url: '/api/v1/vd/metricas/frequencia-cardiaca',
    })
    assert.equal(frequenciaCardiaca.statusCode, 401)

    const frequenciaCardiacaPost = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/metricas/frequencia-cardiaca',
      payload: { bpm: 74, source: 'manual' },
    })
    assert.equal(frequenciaCardiacaPost.statusCode, 401)

    const atividade = await app.inject({ method: 'GET', url: '/api/v1/vd/metricas/atividade' })
    assert.equal(atividade.statusCode, 401)

    const caminhadaPost = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/metricas/atividade/caminhada',
      payload: { steps: 2500, durationMinutes: 30 },
    })
    assert.equal(caminhadaPost.statusCode, 401)

    const corridaPost = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/metricas/atividade/corrida',
      payload: { distanceKm: 5 },
    })
    assert.equal(corridaPost.statusCode, 401)

    const atividadeRegistrarPost = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/metricas/atividade/registrar',
      payload: { kind: 'corrida-caminhada', durationMinutes: 40 },
    })
    assert.equal(atividadeRegistrarPost.statusCode, 401)

    const atividadeLotePost = await app.inject({
      method: 'POST',
      url: '/api/v1/vd/metricas/atividade/lote',
      payload: {
        days: [{ date: '2026-07-01', steps: 5000, sourceLabel: 'Apple Health' }],
      },
    })
    assert.equal(atividadeLotePost.statusCode, 401)

    const integracoes = await app.inject({
      method: 'GET',
      url: '/api/v1/vd/metricas/integracoes',
    })
    assert.equal(integracoes.statusCode, 401)

    const integracaoPut = await app.inject({
      method: 'PUT',
      url: '/api/v1/vd/metricas/integracoes/apple-health',
      payload: {
        status: 'connected',
        permissions: ['steps', 'distance'],
      },
    })
    assert.equal(integracaoPut.statusCode, 401)

    const perfil = await app.inject({ method: 'GET', url: '/api/v1/vd/metricas/perfil' })
    assert.equal(perfil.statusCode, 401)

    const resumo = await app.inject({ method: 'GET', url: '/api/v1/vd/metricas/resumo' })
    assert.equal(resumo.statusCode, 401)

    const update = await app.inject({
      method: 'PUT',
      url: '/api/v1/vd/metricas/perfil',
      payload: { heightMeters: 1.72 },
    })
    assert.equal(update.statusCode, 401)

    await app.close()
  })
})

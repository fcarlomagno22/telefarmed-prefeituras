import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  aggregateAtividadeLeituras,
  deriveDistanceKmFromSteps,
  resolveAtividadeMetrics,
  resolveCaminhadaMetrics,
} from './atividade.formatters.js'
import type { PacienteMetricasLeituraRow } from './types.js'

const baseRow: PacienteMetricasLeituraRow = {
  id: '11111111-1111-1111-1111-111111111111',
  paciente_id: 'pac-1',
  entidade_contratante_id: 'ent-1',
  tipo: 'passos',
  registrado_em: '2026-07-08T10:30:00.000-03:00',
  origem: 'manual',
  valor: 1000,
  valor_secundario: null,
  contexto_glicemia: null,
  medida_corporal: null,
  metadados: { kind: 'caminhada', distanceKm: 0.762 },
  criado_em: '2026-07-08T10:30:00.000-03:00',
}

describe('atividade.formatters', () => {
  it('deriva distância a partir de passos', () => {
    assert.equal(deriveDistanceKmFromSteps(1000), 0.762)
  })

  it('resolve caminhada apenas com passos', () => {
    const metrics = resolveCaminhadaMetrics({ steps: 2000 })
    assert.equal(metrics.steps, 2000)
    assert.equal(metrics.distanceKm, 1.524)
    assert.equal(metrics.distanceKmExplicit, false)
  })

  it('resolve corrida com duração em minutos', () => {
    const metrics = resolveAtividadeMetrics({ durationMinutes: 30 }, 'corrida')
    assert.equal(metrics.steps, 5100)
    assert.equal(metrics.distanceKm, deriveDistanceKmFromSteps(5100))
  })

  it('resolve corrida-caminhada com duração em minutos', () => {
    const metrics = resolveAtividadeMetrics({ durationMinutes: 30 }, 'corrida-caminhada')
    assert.equal(metrics.steps, 4200)
    assert.equal(metrics.distanceKm, deriveDistanceKmFromSteps(4200))
  })

  it('resolve caminhada com duração em minutos', () => {
    const metrics = resolveAtividadeMetrics({ durationMinutes: 30 }, 'caminhada')
    assert.equal(metrics.steps, 3300)
    assert.equal(metrics.distanceKm, deriveDistanceKmFromSteps(3300))
  })

  it('agrega leituras diárias somando passos e distância', () => {
    const days = aggregateAtividadeLeituras([
      baseRow,
      {
        ...baseRow,
        id: '22222222-2222-2222-2222-222222222222',
        registrado_em: '2026-07-08T18:00:00.000-03:00',
        valor: 500,
        metadados: {},
      },
      {
        ...baseRow,
        id: '33333333-3333-3333-3333-333333333333',
        tipo: 'distancia',
        registrado_em: '2026-07-09T09:00:00.000-03:00',
        valor: 2.5,
        metadados: { sourceLabel: 'Apple Health' },
        origem: 'integracao',
      },
    ])

    assert.equal(days.length, 2)
    assert.deepEqual(days[0], {
      id: 'activity-2026-07-09',
      date: '2026-07-09',
      steps: 0,
      distanceKm: 2.5,
      source: 'integracao',
      sourceLabel: 'Apple Health',
    })
    assert.equal(days[1]?.steps, 1500)
    assert.equal(days[1]?.distanceKm, 1.143)
    assert.equal(days[1]?.source, 'manual')
  })

  it('agrega todos os kinds no mesmo dia', () => {
    const days = aggregateAtividadeLeituras([
      {
        ...baseRow,
        metadados: { kind: 'caminhada', distanceKm: 1.524 },
        valor: 2000,
      },
      {
        ...baseRow,
        id: '44444444-4444-4444-4444-444444444444',
        registrado_em: '2026-07-08T12:00:00.000-03:00',
        origem: 'sistema',
        valor: 3000,
        metadados: {
          kind: 'corrida',
          distanceKm: 2.286,
          runWalkActivityId: 'act-1',
        },
      },
      {
        ...baseRow,
        id: '55555555-5555-5555-5555-555555555555',
        registrado_em: '2026-07-08T15:00:00.000-03:00',
        origem: 'sistema',
        valor: 1500,
        metadados: {
          kind: 'corrida-caminhada',
          distanceKm: 1.143,
          runWalkActivityId: 'act-2',
        },
      },
    ])

    assert.equal(days.length, 1)
    assert.equal(days[0]?.steps, 6500)
    assert.equal(days[0]?.distanceKm, 4.953)
    assert.equal(days[0]?.source, 'manual')
  })
})

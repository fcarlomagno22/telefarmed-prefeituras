import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  aggregateAtividadeLeituras,
  deriveDistanceKmFromSteps,
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

  it('resolve caminhada com duração em minutos', () => {
    const metrics = resolveCaminhadaMetrics({ durationMinutes: 30 })
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
})

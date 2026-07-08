import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PacienteMetricasLeituraRow } from '../vd-metricas/types.js'
import {
  mapRunWalkModalityToMetricasKind,
  resolveRunWalkActivitySteps,
  syncRunWalkAtividadeToMetricas,
  type RunWalkMetricasSyncDeps,
} from './run-walk-metricas-sync.service.js'

const scope = {
  pacienteId: 'pac-1',
  entidadeContratanteId: 'ent-1',
  cpf: '12345678901',
}

const activityInput = {
  id: '11111111-1111-1111-1111-111111111111',
  modality: 'run' as const,
  stepCount: 4200,
  distanceKm: 5.2,
  activeMinutes: 38,
  estimatedCalories: 410,
  completedAt: '2026-07-08T10:30:00.000-03:00',
}

function createMockDeps(options?: {
  exists?: boolean
}): {
  deps: RunWalkMetricasSyncDeps
  inserted: Array<Record<string, unknown>>
  existsCalls: string[]
} {
  const inserted: Array<Record<string, unknown>> = []
  const existsCalls: string[] = []

  const deps: RunWalkMetricasSyncDeps = {
    existsLeitura: async (pacienteId, runWalkActivityId) => {
      existsCalls.push(`${pacienteId}:${runWalkActivityId}`)
      return options?.exists ?? false
    },
    insertLeitura: async (_scope, input) => {
      inserted.push(input)
      return {
        id: 'leitura-1',
        paciente_id: scope.pacienteId,
        entidade_contratante_id: scope.entidadeContratanteId,
        tipo: 'passos',
        registrado_em: input.recordedAtIso,
        origem: 'sistema',
        valor: input.steps,
        valor_secundario: null,
        contexto_glicemia: null,
        medida_corporal: null,
        metadados: {
          kind: input.kind,
          distanceKm: input.distanceKm,
          distanceKmExplicit: true,
          durationMinutes: input.durationMinutes,
          estimatedCalories: input.estimatedCalories,
          runWalkActivityId: input.runWalkActivityId,
        },
        criado_em: '2026-07-08T10:31:00.000-03:00',
      } satisfies PacienteMetricasLeituraRow
    },
  }

  return { deps, inserted, existsCalls }
}

describe('run-walk-metricas-sync.service', () => {
  it('mapeia modalidade para kind de métricas', () => {
    assert.equal(mapRunWalkModalityToMetricasKind('walk'), 'caminhada')
    assert.equal(mapRunWalkModalityToMetricasKind('active-walk'), 'caminhada')
    assert.equal(mapRunWalkModalityToMetricasKind('run'), 'corrida')
    assert.equal(mapRunWalkModalityToMetricasKind('run-walk'), 'corrida-caminhada')
    assert.equal(mapRunWalkModalityToMetricasKind('treadmill'), 'caminhada')
  })

  it('resolve passos a partir de distância quando stepCount é zero', () => {
    const steps = resolveRunWalkActivitySteps({
      stepCount: 0,
      distanceKm: 1.524,
      activeMinutes: 0,
    })

    assert.equal(steps, 2000)
  })

  it('cria leitura de atividade com metadados esperados', async () => {
    const { deps, inserted, existsCalls } = createMockDeps()

    const result = await syncRunWalkAtividadeToMetricas({ scope, activity: activityInput }, deps)

    assert.equal(result.created, true)
    assert.equal(existsCalls.length, 1)
    assert.equal(inserted.length, 1)

    const payload = inserted[0]!
    assert.equal(payload.steps, 4200)
    assert.equal(payload.distanceKm, 5.2)
    assert.equal(payload.durationMinutes, 38)
    assert.equal(payload.estimatedCalories, 410)
    assert.equal(payload.runWalkActivityId, activityInput.id)
    assert.equal(payload.kind, 'corrida')
    assert.equal(payload.recordedAtIso, activityInput.completedAt)
  })

  it('não duplica leitura quando atividade já foi sincronizada', async () => {
    const { deps, inserted } = createMockDeps({ exists: true })

    const first = await syncRunWalkAtividadeToMetricas({ scope, activity: activityInput }, deps)
    const second = await syncRunWalkAtividadeToMetricas({ scope, activity: activityInput }, deps)

    assert.deepEqual(first, { created: false, skippedReason: 'already_synced' })
    assert.deepEqual(second, { created: false, skippedReason: 'already_synced' })
    assert.equal(inserted.length, 0)
  })

  it('integra fluxo create → exists → skip sem segunda inserção', async () => {
    let synced = false
    const { deps, inserted } = createMockDeps()

    const integratedDeps: RunWalkMetricasSyncDeps = {
      existsLeitura: async (pacienteId, runWalkActivityId) => {
        assert.equal(pacienteId, scope.pacienteId)
        assert.equal(runWalkActivityId, activityInput.id)
        return synced
      },
      insertLeitura: async (...args) => {
        synced = true
        return deps.insertLeitura(...args)
      },
    }

    const created = await syncRunWalkAtividadeToMetricas(
      { scope, activity: activityInput },
      integratedDeps,
    )
    const replay = await syncRunWalkAtividadeToMetricas(
      { scope, activity: activityInput },
      integratedDeps,
    )

    assert.equal(created.created, true)
    assert.equal(replay.created, false)
    assert.equal(replay.skippedReason, 'already_synced')
    assert.equal(inserted.length, 1)
    assert.equal(inserted[0]?.kind, 'corrida')
    assert.equal(inserted[0]?.estimatedCalories, 410)
  })
})

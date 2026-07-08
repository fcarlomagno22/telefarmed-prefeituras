import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { RunWalkMetasSemanalRow } from './metas-semanais.formatters.js'
import {
  getRunWalkMetasSemanais,
  putRunWalkMetasSemanais,
  type MetasSemanaisServiceDeps,
} from './metas-semanais.service.js'
import type { VdRunWalkPacienteScope } from './types.js'

const NOW = new Date('2026-07-08T15:00:00.000-03:00')
const WEEK_START = '2026-07-06'

const scope: VdRunWalkPacienteScope = {
  pacienteId: 'pac-1',
  entidadeContratanteId: 'ent-1',
  cpf: '12345678901',
}

const sampleRow: RunWalkMetasSemanalRow = {
  id: '11111111-1111-1111-1111-111111111111',
  paciente_id: scope.pacienteId,
  entidade_contratante_id: scope.entidadeContratanteId,
  semana_inicio: WEEK_START,
  target_activities: 4,
  target_active_minutes: 150,
  target_movement_days: 5,
  criado_em: '2026-07-08T10:00:00.000-03:00',
  atualizado_em: '2026-07-08T10:00:00.000-03:00',
}

function createDeps(store: Map<string, RunWalkMetasSemanalRow>): MetasSemanaisServiceDeps {
  return {
    resolveWeekStart: () => WEEK_START,
    findBySemana: async (_scope, semanaInicio) => store.get(semanaInicio) ?? null,
    upsert: async (_scope, semanaInicio, input) => {
      const existing = store.get(semanaInicio)
      const row: RunWalkMetasSemanalRow = {
        id: existing?.id ?? '22222222-2222-2222-2222-222222222222',
        paciente_id: scope.pacienteId,
        entidade_contratante_id: scope.entidadeContratanteId,
        semana_inicio: semanaInicio,
        target_activities: input.targetActivities,
        target_active_minutes: input.targetActiveMinutes,
        target_movement_days: input.targetMovementDays,
        criado_em: existing?.criado_em ?? '2026-07-08T10:00:00.000-03:00',
        atualizado_em: '2026-07-08T12:00:00.000-03:00',
      }
      store.set(semanaInicio, row)
      return row
    },
  }
}

describe('metas-semanais.service', () => {
  it('GET retorna meta vazia quando paciente ainda não definiu metas', async () => {
    const deps = createDeps(new Map())

    const result = await getRunWalkMetasSemanais(scope, NOW, deps)

    assert.equal(result.weekStartDate, WEEK_START)
    assert.equal(result.targets, null)
  })

  it('PUT cria meta da semana corrente', async () => {
    const store = new Map<string, RunWalkMetasSemanalRow>()
    const deps = createDeps(store)

    const created = await putRunWalkMetasSemanais(
      scope,
      {
        targetActivities: 4,
        targetActiveMinutes: 150,
        targetMovementDays: 5,
      },
      NOW,
      deps,
    )

    assert.deepEqual(created.targets, {
      targetActivities: 4,
      targetActiveMinutes: 150,
      targetMovementDays: 5,
    })
    assert.equal(store.size, 1)
  })

  it('GET retorna meta após PUT', async () => {
    const store = new Map<string, RunWalkMetasSemanalRow>()
    const deps = createDeps(store)

    await putRunWalkMetasSemanais(
      scope,
      {
        targetActivities: 3,
        targetActiveMinutes: 90,
        targetMovementDays: 4,
      },
      NOW,
      deps,
    )

    const loaded = await getRunWalkMetasSemanais(scope, NOW, deps)

    assert.deepEqual(loaded.targets, {
      targetActivities: 3,
      targetActiveMinutes: 90,
      targetMovementDays: 4,
    })
  })

  it('PUT atualiza meta existente da mesma semana (upsert)', async () => {
    const store = new Map<string, RunWalkMetasSemanalRow>([[WEEK_START, sampleRow]])
    const deps = createDeps(store)

    const updated = await putRunWalkMetasSemanais(
      scope,
      {
        targetActivities: 5,
        targetActiveMinutes: 210,
        targetMovementDays: 6,
      },
      NOW,
      deps,
    )

    assert.deepEqual(updated.targets, {
      targetActivities: 5,
      targetActiveMinutes: 210,
      targetMovementDays: 6,
    })
    assert.equal(store.size, 1)
    assert.equal(store.get(WEEK_START)?.id, sampleRow.id)
    assert.equal(store.get(WEEK_START)?.atualizado_em, '2026-07-08T12:00:00.000-03:00')
  })
})

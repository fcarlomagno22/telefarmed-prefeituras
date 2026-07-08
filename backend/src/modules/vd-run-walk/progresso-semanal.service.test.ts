import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { RunWalkMetasSemanalRow } from './metas-semanais.formatters.js'
import type { RunWalkProgressoSemanalRow } from './progresso-semanal.repository.js'
import {
  getRunWalkMetasSemanaisProgresso,
  type MetasSemanaisProgressoServiceDeps,
} from './progresso-semanal.service.js'
import type { VdRunWalkPacienteScope } from './types.js'

const NOW = new Date('2026-07-08T15:00:00.000-03:00')
const WEEK_START = '2026-07-06'

const scope: VdRunWalkPacienteScope = {
  pacienteId: 'pac-1',
  entidadeContratanteId: 'ent-1',
  cpf: '12345678901',
}

const metasRow: RunWalkMetasSemanalRow = {
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

const progressoRow: RunWalkProgressoSemanalRow = {
  id: '22222222-2222-2222-2222-222222222222',
  paciente_id: scope.pacienteId,
  entidade_contratante_id: scope.entidadeContratanteId,
  semana_inicio: WEEK_START,
  completed_activities: 0,
  active_minutes: 0,
  movement_days: 0,
  daily_extra_minutes: { '2026-07-06': 15 },
  extra_completed_activities: 1,
  extra_active_minutes: 15,
  extra_movement_days: 1,
  criado_em: '2026-07-08T10:00:00.000-03:00',
  atualizado_em: '2026-07-08T10:00:00.000-03:00',
}

function createDeps(
  overrides?: Partial<MetasSemanaisProgressoServiceDeps>,
): MetasSemanaisProgressoServiceDeps {
  return {
    resolveWeekStart: () => WEEK_START,
    listWeekActivities: async () => [
      {
        id: 'activity-1',
        modality: 'run',
        activity_name: 'Corrida leve',
        active_minutes: 35,
        completed_at: '2026-07-08T07:30:00.000-03:00',
      },
    ],
    findMetas: async () => metasRow,
    findProgressoExtras: async () => progressoRow,
    ...overrides,
  }
}

describe('getRunWalkMetasSemanaisProgresso', () => {
  it('combina atividades da semana, metas e ajustes manuais', async () => {
    const result = await getRunWalkMetasSemanaisProgresso(scope, NOW, createDeps())

    assert.equal(result.weekStartDate, WEEK_START)
    assert.equal(result.weeklyGoal.targetActivities, 4)
    assert.equal(result.weeklyGoal.completedActivities, 2)
    assert.equal(result.weeklyGoal.activeMinutes, 50)
    assert.equal(result.weeklyGoal.movementDays, 2)
    assert.deepEqual(result.dailyExtraMinutes, { '2026-07-06': 15 })
    assert.equal(result.weeklyCalendar.length, 7)
  })

  it('retorna metas zeradas quando paciente ainda não definiu meta', async () => {
    const result = await getRunWalkMetasSemanaisProgresso(
      scope,
      NOW,
      createDeps({
        findMetas: async () => null,
        findProgressoExtras: async () => null,
        listWeekActivities: async () => [],
      }),
    )

    assert.equal(result.weeklyGoal.targetActivities, 0)
    assert.equal(result.weeklyGoal.completedActivities, 0)
    assert.deepEqual(result.dailyExtraMinutes, {})
  })
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getRunWalkDisposicao,
  postRunWalkDisposicaoCheckin,
  type DisposicaoCheckinServiceDeps,
  type DisposicaoServiceDeps,
} from './disposicao.service.js'
import type { VdRunWalkPacienteScope } from './types.js'

const NOW = new Date('2026-07-08T15:00:00.000-03:00')
const TODAY = '2026-07-08'

const scope: VdRunWalkPacienteScope = {
  pacienteId: 'pac-1',
  entidadeContratanteId: 'ent-1',
  cpf: '12345678901',
}

function createDeps(overrides?: Partial<DisposicaoServiceDeps>): DisposicaoServiceDeps {
  return {
    resolveTodayDateKey: () => TODAY,
    findCheckin: async () => ({
      id: 'checkin-1',
      paciente_id: scope.pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      checkin_date: TODAY,
      mood: 'good',
      slept_well: true,
      has_pain: false,
      low_energy: false,
      prefer_lighter: false,
      prefer_walk_over_run: false,
      recommendation: 'keep',
      criado_em: '2026-07-08T08:00:00.000-03:00',
      atualizado_em: '2026-07-08T08:00:00.000-03:00',
    }),
    listRecentActivities: async () => [
      {
        active_minutes: 30,
        completed_at: '2026-07-07T07:30:00.000-03:00',
        modality: 'walk',
      },
    ],
    loadMetricasSnapshot: async () => ({
      hidratacaoMlHoje: 1600,
      frequenciaBpm: 76,
      frequenciaBpmAvg7d: 78,
    }),
    ...overrides,
  }
}

describe('getRunWalkDisposicao', () => {
  it('agrega check-in, atividades recentes e métricas', async () => {
    const result = await getRunWalkDisposicao(scope, NOW, createDeps())

    assert.equal(result.level, 'good')
    assert.equal(result.message, 'Sua disposição está boa')
    assert.equal(result.factors.length, 7)
    assert.equal(result.checkinCompletedToday, true)
    assert.equal(result.factors.find((factor) => factor.id === 'hydration')?.value, 'Meta parcialmente atingida')
  })

  it('funciona sem check-in nem métricas', async () => {
    const result = await getRunWalkDisposicao(
      scope,
      NOW,
      createDeps({
        findCheckin: async () => null,
        listRecentActivities: async () => [],
        loadMetricasSnapshot: async () => ({
          hidratacaoMlHoje: null,
          frequenciaBpm: null,
          frequenciaBpmAvg7d: null,
        }),
      }),
    )

    assert.ok(['good', 'moderate'].includes(result.level))
    assert.equal(result.checkinCompletedToday, false)
    assert.equal(
      result.factors.find((factor) => factor.id === 'fatigue')?.value,
      'Nenhum registro recente',
    )
  })
})

function createCheckinDeps(
  overrides?: Partial<DisposicaoCheckinServiceDeps>,
): DisposicaoCheckinServiceDeps {
  const base = createDeps()
  return {
    ...base,
    upsertCheckin: async () => ({
      id: 'checkin-2',
      paciente_id: scope.pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      checkin_date: TODAY,
      mood: 'tired',
      slept_well: false,
      has_pain: false,
      low_energy: false,
      prefer_lighter: false,
      prefer_walk_over_run: false,
      recommendation: 'reduce-time',
      criado_em: '2026-07-08T09:00:00.000-03:00',
      atualizado_em: '2026-07-08T09:00:00.000-03:00',
    }),
    ...overrides,
  }
}

describe('postRunWalkDisposicaoCheckin', () => {
  it('faz upsert do dia e retorna disposição recalculada', async () => {
    let upsertedRecommendation: string | null = null

    const result = await postRunWalkDisposicaoCheckin(
      scope,
      {
        mood: 'tired',
        sleptWell: false,
        hasPain: false,
        lowEnergy: false,
      },
      NOW,
      createCheckinDeps({
        upsertCheckin: async (_scope, _date, input) => {
          upsertedRecommendation = input.recommendation
          return {
            id: 'checkin-2',
            paciente_id: scope.pacienteId,
            entidade_contratante_id: scope.entidadeContratanteId,
            checkin_date: TODAY,
            mood: input.mood,
            slept_well: input.sleptWell ?? null,
            has_pain: input.hasPain ?? null,
            low_energy: input.lowEnergy ?? null,
            prefer_lighter: input.preferLighter ?? null,
            prefer_walk_over_run: input.preferWalkOverRun ?? null,
            recommendation: input.recommendation,
            criado_em: '2026-07-08T09:00:00.000-03:00',
            atualizado_em: '2026-07-08T09:00:00.000-03:00',
          }
        },
        findCheckin: async () => ({
          id: 'checkin-2',
          paciente_id: scope.pacienteId,
          entidade_contratante_id: scope.entidadeContratanteId,
          checkin_date: TODAY,
          mood: 'tired',
          slept_well: false,
          has_pain: false,
          low_energy: false,
          prefer_lighter: false,
          prefer_walk_over_run: false,
          recommendation: 'reduce-time',
          criado_em: '2026-07-08T09:00:00.000-03:00',
          atualizado_em: '2026-07-08T09:00:00.000-03:00',
        }),
      }),
    )

    assert.equal(upsertedRecommendation, 'reduce-time')
    assert.equal(result.checkin.mood, 'tired')
    assert.equal(result.checkin.recommendation, 'reduce-time')
    assert.equal(result.checkin.recommendationLabel, 'Reduzir o tempo da atividade')
    assert.equal(result.disposition.factors.length, 7)
    assert.equal(result.disposition.checkinCompletedToday, true)
    assert.ok(['moderate', 'low', 'rest'].includes(result.disposition.level))
  })
})

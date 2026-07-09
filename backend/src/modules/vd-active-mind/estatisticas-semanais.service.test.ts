import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getActiveMindEstatisticasSemanais } from './estatisticas-semanais.service.js'
import { aggregateWeeklyActiveMindStats } from './sessoes.formatters.js'
import type { WeeklyStatsSessaoRow } from './sessoes.repository.js'
import type { VdActiveMindPacienteScope } from './types.js'

const scope: VdActiveMindPacienteScope = {
  pacienteId: '11111111-1111-1111-1111-111111111111',
  entidadeContratanteId: '22222222-2222-2222-2222-222222222222',
  cpf: '12345678901',
}

const weekBounds = {
  startIso: '2026-07-06T03:00:00.000Z',
  endIso: '2026-07-13T02:59:59.999Z',
}

describe('aggregateWeeklyActiveMindStats', () => {
  it('agrega sessões da semana por jogo', () => {
    const stats = aggregateWeeklyActiveMindStats(
      [
        {
          game_id: 'sudoku',
          duration_sec: 300,
          attempts: 10,
          correct: 8,
          errors: 2,
        },
        {
          game_id: 'sudoku',
          duration_sec: 180,
          attempts: 6,
          correct: 5,
          errors: 1,
        },
        {
          game_id: 'crosswords',
          duration_sec: null,
          attempts: 4,
          correct: 3,
          errors: 1,
        },
      ],
      weekBounds,
    )

    assert.equal(stats.totalSessions, 3)
    assert.equal(stats.totalDurationSec, 480)
    assert.equal(stats.weekStartIso, weekBounds.startIso)
    assert.equal(stats.weekEndIso, weekBounds.endIso)
    assert.equal(stats.byGame.length, 2)
    assert.deepEqual(stats.byGame[0], {
      gameId: 'sudoku',
      count: 2,
      totalAttempts: 16,
      totalCorrect: 13,
      totalErrors: 3,
    })
    assert.deepEqual(stats.byGame[1], {
      gameId: 'crosswords',
      count: 1,
      totalAttempts: 4,
      totalCorrect: 3,
      totalErrors: 1,
    })
  })

  it('retorna zeros sem sessões', () => {
    const stats = aggregateWeeklyActiveMindStats([], weekBounds)

    assert.deepEqual(stats, {
      totalSessions: 0,
      totalDurationSec: 0,
      byGame: [],
      weekStartIso: weekBounds.startIso,
      weekEndIso: weekBounds.endIso,
    })
  })

  it('trata duration_sec null como zero e ordena byGame por count desc', () => {
    const stats = aggregateWeeklyActiveMindStats(
      [
        {
          game_id: 'form-the-word',
          duration_sec: null,
          attempts: 1,
          correct: 1,
          errors: 0,
        },
        {
          game_id: 'logic-sequence',
          duration_sec: null,
          attempts: 2,
          correct: 1,
          errors: 1,
        },
        {
          game_id: 'logic-sequence',
          duration_sec: 45,
          attempts: 3,
          correct: 2,
          errors: 1,
        },
        {
          game_id: 'word-search',
          duration_sec: 10,
          attempts: 1,
          correct: 1,
          errors: 0,
        },
      ],
      weekBounds,
    )

    assert.equal(stats.totalSessions, 4)
    assert.equal(stats.totalDurationSec, 55)
    assert.equal(stats.byGame[0]?.gameId, 'logic-sequence')
    assert.equal(stats.byGame[0]?.count, 2)
    assert.equal(stats.byGame[1]?.count, 1)
    assert.equal(stats.byGame[2]?.count, 1)
  })
})

describe('getActiveMindEstatisticasSemanais', () => {
  it('usa deps in-memory para montar estatísticas semanais', async () => {
    const inMemoryRows: WeeklyStatsSessaoRow[] = [
      {
        game_id: 'calculations',
        difficulty: 'medio',
        duration_sec: 120,
        attempts: 5,
        correct: 4,
        errors: 1,
        reveals: 0,
      },
      {
        game_id: 'word-search',
        difficulty: 'facil',
        duration_sec: 90,
        attempts: 3,
        correct: 3,
        errors: 0,
        reveals: 0,
      },
    ]

    const stats = await getActiveMindEstatisticasSemanais(
      scope,
      { weekStartIso: weekBounds.startIso },
      {
        listSessoesForWeeklyStats: async () => inMemoryRows,
      },
    )

    assert.equal(stats.totalSessions, 2)
    assert.equal(stats.totalDurationSec, 210)
    assert.equal(stats.byGame.length, 2)
    assert.equal(stats.weekStartIso, weekBounds.startIso)
    assert.equal(stats.weekEndIso, weekBounds.endIso)
  })
})

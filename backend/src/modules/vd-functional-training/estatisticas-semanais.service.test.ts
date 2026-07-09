import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { aggregateWeeklyTrainingStats } from './sessoes.formatters.js'

describe('aggregateWeeklyTrainingStats', () => {
  it('agrega sessões da semana', () => {
    const stats = aggregateWeeklyTrainingStats([
      { total_active_sec: 120, exercise_ids: ['afundo', 'abdominal-reverso'] },
      { total_active_sec: 60, exercise_ids: ['afundo'] },
    ])

    assert.equal(stats.sessionsCount, 2)
    assert.equal(stats.totalActiveMinutes, 3)
    assert.equal(stats.uniqueExercises, 2)
  })

  it('retorna zeros sem sessões', () => {
    const stats = aggregateWeeklyTrainingStats([])
    assert.deepEqual(stats, {
      sessionsCount: 0,
      totalActiveMinutes: 0,
      uniqueExercises: 0,
    })
  })
})

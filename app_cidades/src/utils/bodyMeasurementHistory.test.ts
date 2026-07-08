import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  mergeBodyMeasurementPoint,
  upsertDailyBodyMeasurementPoint,
} from './bodyMeasurementHistory'

describe('bodyMeasurementHistory', () => {
  it('mantém a última leitura do dia', () => {
    const series = upsertDailyBodyMeasurementPoint(
      [{ date: '2026-07-08', value: 90 }],
      { date: '2026-07-08', value: 88 },
    )

    assert.deepEqual(series, [{ date: '2026-07-08', value: 88 }])
  })

  it('mescla ponto em histórico parcial', () => {
    const history = mergeBodyMeasurementPoint({}, 'cintura', { date: '2026-07-08', value: 84 })

    assert.deepEqual(history, {
      cintura: [{ date: '2026-07-08', value: 84 }],
    })
  })
})

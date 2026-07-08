import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildPeriodSelection } from './metricsPeriod'
import {
  getHydrationSeriesForPeriod,
  hydrationHistoryToMetricPoints,
  mergeHydrationDay,
} from './hydrationHistory'

describe('hydrationHistory utils', () => {
  it('mescla dia atualizado mantendo ordenação', () => {
    const merged = mergeHydrationDay(
      [{ id: 'hydration-2026-07-07', date: '2026-07-07', totalMl: 1800 }],
      { id: 'hydration-2026-07-08', date: '2026-07-08', totalMl: 500 },
    )

    assert.equal(merged[0]?.date, '2026-07-08')
    assert.equal(merged[1]?.date, '2026-07-07')
  })

  it('converte histórico diário para litros no gráfico', () => {
    const points = hydrationHistoryToMetricPoints([
      { id: 'hydration-2026-07-07', date: '2026-07-07', totalMl: 1500 },
      { id: 'hydration-2026-07-08', date: '2026-07-08', totalMl: 2000 },
    ])

    assert.deepEqual(points, [
      { date: '2026-07-07', value: 1.5 },
      { date: '2026-07-08', value: 2 },
    ])
  })

  it('filtra série pelo período selecionado', () => {
    const period = buildPeriodSelection('custom', new Date('2026-07-08T00:00:00'), new Date('2026-07-08T23:59:59'))
    const series = getHydrationSeriesForPeriod(
      [
        { id: 'hydration-2026-07-07', date: '2026-07-07', totalMl: 1500 },
        { id: 'hydration-2026-07-08', date: '2026-07-08', totalMl: 2000 },
      ],
      period,
    )

    assert.equal(series.length, 1)
    assert.equal(series[0]?.value, 2)
  })
})

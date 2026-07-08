import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildPeriodSelection } from './metricsPeriod'
import {
  buildImcSeriesFromWeightHistory,
  ensureMinimumWeightChartPoints,
  getWeightSeriesForPeriod,
  mergeWeightPoint,
} from './weightHistory'
import { buildDefaultWeightHistoryRange, periodSelectionToIsoRange } from './weightHistoryQuery'

describe('weightHistory utils', () => {
  it('monta série de IMC a partir do histórico de peso', () => {
    const series = buildImcSeriesFromWeightHistory(
      [
        { date: '2026-07-07', value: 80 },
        { date: '2026-07-08', value: 78 },
      ],
      { height: '1,72 m', weight: '78 kg', age: '34 anos', gender: 'Masculino' },
    )

    assert.deepEqual(series, [
      { date: '2026-07-07', value: 27 },
      { date: '2026-07-08', value: 26.4 },
    ])
  })

  it('usa peso do perfil quando histórico está vazio', () => {
    const points = ensureMinimumWeightChartPoints([], {
      height: '1,72 m',
      weight: '78 kg',
      age: '',
      gender: '',
    })

    assert.equal(points.length, 1)
    assert.equal(points[0]?.value, 78)
  })

  it('filtra histórico pelo período selecionado', () => {
    const period = buildPeriodSelection('week')
    const series = getWeightSeriesForPeriod(
      [
        { date: '2000-01-01', value: 90 },
        { date: period.start.toISOString().slice(0, 10), value: 78 },
      ],
      period,
    )

    assert.equal(series.length, 1)
    assert.equal(series[0]?.value, 78)
  })

  it('mescla ponto novo mantendo ordenação', () => {
    const merged = mergeWeightPoint(
      [{ date: '2026-07-07', value: 79 }],
      { date: '2026-07-08', value: 78 },
    )

    assert.deepEqual(merged, [
      { date: '2026-07-07', value: 79 },
      { date: '2026-07-08', value: 78 },
    ])
  })
})

describe('weightHistoryQuery', () => {
  it('converte PeriodSelection para ISO', () => {
    const period = buildPeriodSelection('today')
    const range = periodSelectionToIsoRange(period)

    assert.equal(typeof range.start, 'string')
    assert.equal(typeof range.end, 'string')
    assert.ok(range.start <= range.end)
  })

  it('gera intervalo padrão de 90 dias', () => {
    const range = buildDefaultWeightHistoryRange()
    const start = new Date(range.start)
    const end = new Date(range.end)
    const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))

    assert.ok(diffDays >= 89 && diffDays <= 90)
  })
})

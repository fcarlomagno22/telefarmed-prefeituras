import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildPeriodSelection } from './metricsPeriod'
import {
  bloodPressureHistoryToMetricPoints,
  getBloodPressureSeriesForPeriod,
  getLatestBloodPressureEntry,
  mergeBloodPressureReading,
} from './bloodPressureHistory'

const sample = [
  {
    id: '1',
    recordedAt: '2026-07-07T08:00:00.000-03:00',
    systolic: 118,
    diastolic: 76,
  },
  {
    id: '2',
    recordedAt: '2026-07-07T20:00:00.000-03:00',
    systolic: 124,
    diastolic: 80,
  },
  {
    id: '3',
    recordedAt: '2026-07-08T09:30:00.000-03:00',
    systolic: 120,
    diastolic: 78,
  },
]

describe('bloodPressureHistory utils', () => {
  it('retorna a leitura mais recente', () => {
    const latest = getLatestBloodPressureEntry(sample)
    assert.equal(latest?.id, '3')
  })

  it('mescla leitura mantendo ordenação crescente', () => {
    const merged = mergeBloodPressureReading(sample.slice(0, 2), sample[2]!)
    assert.deepEqual(
      merged.map((entry) => entry.id),
      ['1', '2', '3'],
    )
  })

  it('converte histórico diário usando a última leitura do dia com diastólica', () => {
    const points = bloodPressureHistoryToMetricPoints(sample, false)
    assert.deepEqual(points, [
      { date: '2026-07-07', value: 124, diastolic: 80 },
      { date: '2026-07-08', value: 120, diastolic: 78 },
    ])
  })

  it('converte histórico horário preservando sistólica e diastólica', () => {
    const points = bloodPressureHistoryToMetricPoints([sample[2]!], true)
    assert.equal(points.length, 1)
    assert.equal(points[0]?.value, 120)
    assert.equal(points[0]?.diastolic, 78)
    assert.equal(typeof points[0]?.hour, 'number')
  })

  it('filtra série pelo período selecionado', () => {
    const period = buildPeriodSelection('custom', new Date('2026-07-08T00:00:00'), new Date('2026-07-08T23:59:59'))
    const series = getBloodPressureSeriesForPeriod(sample, period)
    assert.equal(series.length, 1)
    assert.equal(series[0]?.value, 120)
    assert.equal(series[0]?.diastolic, 78)
  })
})
